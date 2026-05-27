-- Password reset: resolve/consume tokens in DB; password hash via Auth Admin API (app layer).

CREATE OR REPLACE FUNCTION public.resolve_password_reset_token(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_hash text;
  v_row public.password_reset_tokens%ROWTYPE;
  v_username text;
BEGIN
  v_hash := public.hash_reset_token(p_token);

  SELECT *
  INTO v_row
  FROM public.password_reset_tokens
  WHERE
    token_hash = v_hash
    AND consumed_at IS NULL
    AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'invalid_or_expired_token';
  END IF;

  SELECT username INTO v_username
  FROM public.profiles
  WHERE id = v_row.user_id;

  IF v_username IS NULL THEN
    RAISE EXCEPTION 'user_not_found';
  END IF;

  RETURN jsonb_build_object(
    'user_id',
    v_row.user_id,
    'username',
    v_username
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.consume_password_reset_token(
  p_token text,
  p_ip inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_hash text;
  v_row public.password_reset_tokens%ROWTYPE;
  v_username text;
BEGIN
  v_hash := public.hash_reset_token(p_token);

  SELECT *
  INTO v_row
  FROM public.password_reset_tokens
  WHERE
    token_hash = v_hash
    AND consumed_at IS NULL
    AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'invalid_or_expired_token';
  END IF;

  UPDATE public.password_reset_tokens
  SET consumed_at = now()
  WHERE id = v_row.id;

  SELECT username INTO v_username
  FROM public.profiles
  WHERE id = v_row.user_id;

  PERFORM public.write_audit_log(
    v_row.user_id,
    v_row.user_id,
    'user.password_reset_complete',
    jsonb_build_object('username', v_username),
    p_ip,
    p_user_agent
  );

  RETURN jsonb_build_object('user_id', v_row.user_id, 'username', v_username);
END;
$$;

-- Remove broken auth rows so Admin API can recreate (profile row kept).
CREATE OR REPLACE FUNCTION public.cleanup_auth_user_for_repair(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  DELETE FROM public.password_reset_tokens WHERE user_id = p_user_id;
  DELETE FROM auth.identities WHERE user_id = p_user_id;
  DELETE FROM auth.users WHERE id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_password_reset_token (text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_password_reset_token (text, inet, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_auth_user_for_repair (uuid) TO authenticated;
