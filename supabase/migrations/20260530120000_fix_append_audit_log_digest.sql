-- Fix append_audit_log on Supabase Cloud: pgcrypto lives in extensions schema;
-- digest(text, unknown) fails without bytea cast + extensions in search_path.

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.append_audit_log(
  p_actor_id uuid,
  p_action public.audit_action,
  p_target_type varchar,
  p_target_id uuid,
  p_ip inet,
  p_user_agent text,
  p_metadata jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_id uuid := gen_random_uuid();
  v_prev char(64);
  v_row char(64);
  v_payload bytea;
BEGIN
  SELECT row_hash INTO v_prev
  FROM public.audit_logs
  ORDER BY created_at DESC
  LIMIT 1;

  v_payload := convert_to(
    coalesce(v_prev, '')
      || v_id::text
      || p_action::text
      || coalesce(p_actor_id::text, '')
      || coalesce(p_target_id::text, '')
      || coalesce(p_metadata::text, '')
      || clock_timestamp()::text,
    'UTF8'
  );

  v_row := encode(digest(v_payload, 'sha256'), 'hex');

  INSERT INTO public.audit_logs (
    id,
    actor_id,
    action,
    target_type,
    target_id,
    ip_address,
    user_agent,
    metadata,
    prev_hash,
    row_hash,
    created_at
  ) VALUES (
    v_id,
    p_actor_id,
    p_action,
    p_target_type,
    p_target_id,
    p_ip,
    p_user_agent,
    p_metadata,
    v_prev,
    v_row,
    now()
  );

  RETURN v_id;
END;
$$;
