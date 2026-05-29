-- M2-C: admin profile SECURITY DEFINER helpers (database.md §7.4; service_role only)

CREATE OR REPLACE FUNCTION public.admin_update_profile(
  p_user_id uuid,
  p_display_name varchar DEFAULT NULL,
  p_role public.user_role DEFAULT NULL,
  p_contact varchar DEFAULT NULL,
  p_touch_display_name boolean DEFAULT false,
  p_touch_role boolean DEFAULT false,
  p_touch_contact boolean DEFAULT false
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.profiles;
BEGIN
  UPDATE public.profiles
  SET
    display_name = CASE WHEN p_touch_display_name THEN p_display_name ELSE display_name END,
    role = CASE WHEN p_touch_role THEN p_role ELSE role END,
    contact = CASE WHEN p_touch_contact THEN p_contact ELSE contact END,
    updated_at = now()
  WHERE id = p_user_id
  RETURNING * INTO v_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'profile_not_found';
  END IF;

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_user_status(
  p_user_id uuid,
  p_status public.user_status
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.profiles;
BEGIN
  UPDATE public.profiles
  SET status = p_status,
      updated_at = now()
  WHERE id = p_user_id
  RETURNING * INTO v_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'profile_not_found';
  END IF;

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_mark_password_reset_required(
  p_user_id uuid,
  p_required boolean DEFAULT true
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET requires_password_change = p_required,
      updated_at = now()
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'profile_not_found';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_update_profile(uuid, varchar, public.user_role, varchar, boolean, boolean, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_set_user_status(uuid, public.user_status) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_mark_password_reset_required(uuid, boolean) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.admin_update_profile(uuid, varchar, public.user_role, varchar, boolean, boolean, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_set_user_status(uuid, public.user_status) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_mark_password_reset_required(uuid, boolean) TO service_role;

CREATE OR REPLACE FUNCTION public.admin_apply_password_reset(
  p_user_id uuid,
  p_actor_id uuid,
  p_ip inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET requires_password_change = true,
      updated_at = now()
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'profile_not_found';
  END IF;

  PERFORM public.append_audit_log(
    p_actor_id,
    'auth.password_reset'::public.audit_action,
    'profile',
    p_user_id,
    p_ip,
    p_user_agent,
    '{}'::jsonb
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_apply_password_reset(uuid, uuid, inet, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_apply_password_reset(uuid, uuid, inet, text) TO service_role;
