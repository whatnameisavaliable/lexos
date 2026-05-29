-- M0-B B10: security DEFINER functions (database.md §4.1, §4.11–§4.12, §7.4)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin' AND status = 'enabled'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_enabled_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND status = 'enabled'
  );
$$;

REVOKE ALL ON FUNCTION public.current_user_role() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_enabled_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_enabled_user() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.transition_task_status(
  p_task_id uuid,
  p_from public.transcription_task_status,
  p_to public.transcription_task_status
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated int;
BEGIN
  UPDATE public.transcription_tasks
  SET status = p_to,
      status_changed_at = now(),
      last_progress_at = now(),
      updated_at = now()
  WHERE id = p_task_id
    AND status = p_from
    AND deleted_at IS NULL;
  GET DIAGNOSTICS updated = ROW_COUNT;
  RETURN updated = 1;
END;
$$;

REVOKE ALL ON FUNCTION public.transition_task_status(
  uuid, public.transcription_task_status, public.transcription_task_status
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.transition_task_status(
  uuid, public.transcription_task_status, public.transcription_task_status
) TO service_role;

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
SET search_path = public
AS $$
DECLARE
  v_id uuid := gen_random_uuid();
  v_prev char(64);
  v_row char(64);
BEGIN
  SELECT row_hash INTO v_prev
  FROM public.audit_logs
  ORDER BY created_at DESC
  LIMIT 1;

  v_row := encode(
    digest(
      coalesce(v_prev, '')
        || v_id::text
        || p_action::text
        || coalesce(p_actor_id::text, '')
        || coalesce(p_target_id::text, '')
        || p_metadata::text
        || clock_timestamp()::text,
      'sha256'
    ),
    'hex'
  );

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

REVOKE ALL ON FUNCTION public.append_audit_log(
  uuid, public.audit_action, varchar, uuid, inet, text, jsonb
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.append_audit_log(
  uuid, public.audit_action, varchar, uuid, inet, text, jsonb
) TO service_role;

CREATE OR REPLACE FUNCTION public.complete_password_change()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET requires_password_change = false,
      updated_at = now()
  WHERE id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'profile_not_found';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.complete_password_change() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_password_change() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.set_profile_mfa_enabled(
  p_user_id uuid,
  p_enabled boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS DISTINCT FROM p_user_id AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'mfa_profile_update_forbidden';
  END IF;

  UPDATE public.profiles
  SET mfa_enabled = p_enabled,
      updated_at = now()
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'profile_not_found';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.set_profile_mfa_enabled(uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_profile_mfa_enabled(uuid, boolean)
  TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.profiles_guard_self_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF public.current_user_role() = 'admin' THEN
    RETURN NEW;
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role
     OR NEW.status IS DISTINCT FROM OLD.status
     OR NEW.username IS DISTINCT FROM OLD.username
     OR NEW.requires_password_change IS DISTINCT FROM OLD.requires_password_change
     OR NEW.mfa_enabled IS DISTINCT FROM OLD.mfa_enabled
     OR NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'profiles_escalation_denied';
  END IF;

  RETURN NEW;
END;
$$;
