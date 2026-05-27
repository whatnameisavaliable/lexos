-- cleanup_auth_user_for_repair must detach audit_logs before deleting auth.users

CREATE OR REPLACE FUNCTION public.cleanup_auth_user_for_repair(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  DELETE FROM public.password_reset_tokens
  WHERE user_id = p_user_id;

  UPDATE public.audit_logs
  SET actor_id = NULL
  WHERE actor_id = p_user_id;

  DELETE FROM auth.identities
  WHERE user_id = p_user_id;

  DELETE FROM auth.users
  WHERE id = p_user_id;
END;
$$;
