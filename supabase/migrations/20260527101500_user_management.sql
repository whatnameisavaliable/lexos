-- LexOS user management: profiles, RLS, reset tokens, audit logs, admin RPCs

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------
CREATE TYPE public.user_role AS ENUM (
  'admin',
  'lawyer',
  'client',
  'channel_partner',
  'director'
);

CREATE TYPE public.user_status AS ENUM (
  'active',
  'disabled',
  'resigned',
  'deleted'
);

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  username text NOT NULL,
  role public.user_role NOT NULL,
  status public.user_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profiles_username_unique UNIQUE (username),
  CONSTRAINT profiles_username_format CHECK (username ~ '^[a-zA-Z0-9]+$'),
  CONSTRAINT profiles_admin_identity CHECK (
    (role = 'admin' AND username = 'admin')
    OR (role <> 'admin')
  )
);

CREATE UNIQUE INDEX profiles_single_admin_idx ON public.profiles ((true))
WHERE
  role = 'admin';

CREATE TABLE public.role_permissions (
  role public.user_role NOT NULL,
  permission_key text NOT NULL,
  PRIMARY KEY (role, permission_key)
);

CREATE TABLE public.password_reset_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  token_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_by uuid REFERENCES auth.users (id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX password_reset_tokens_user_active_idx ON public.password_reset_tokens (user_id)
WHERE
  consumed_at IS NULL;

CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users (id),
  target_id uuid,
  action text NOT NULL,
  diff jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX audit_logs_created_at_idx ON public.audit_logs (created_at DESC);

CREATE TABLE public.app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL
);

INSERT INTO public.app_settings (key, value)
VALUES ('audit_log_retention_days', '180'::jsonb);

-- Default permission seeds (role template + reusable permission keys)
INSERT INTO public.role_permissions (role, permission_key)
VALUES
  ('admin', 'dashboard.view'),
  ('admin', 'users.manage'),
  ('admin', 'users.view'),
  ('admin', 'audit.view'),
  ('lawyer', 'dashboard.view'),
  ('lawyer', 'cases.view'),
  ('client', 'dashboard.view'),
  ('client', 'cases.view_own'),
  ('channel_partner', 'dashboard.view'),
  ('channel_partner', 'referrals.view'),
  ('director', 'dashboard.view'),
  ('director', 'reports.view');

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.username_to_email(p_username text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT p_username || '@lexos.internal';
$$;

CREATE OR REPLACE FUNCTION public.touch_profiles_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.touch_profiles_updated_at();

CREATE OR REPLACE FUNCTION public.prevent_profile_immutable_changes()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.username IS DISTINCT FROM NEW.username THEN
    RAISE EXCEPTION 'username_immutable';
  END IF;

  IF OLD.role = 'admin' AND NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'admin_role_immutable';
  END IF;

  IF NEW.role = 'admin' AND NEW.username <> 'admin' THEN
    RAISE EXCEPTION 'only_builtin_admin_allowed';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_immutable_guard
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_profile_immutable_changes();

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE
      id = auth.uid()
      AND role = 'admin'
      AND username = 'admin'
      AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.has_permission(p_permission text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    INNER JOIN public.role_permissions rp ON rp.role = p.role
    WHERE
      p.id = auth.uid()
      AND p.status = 'active'
      AND rp.permission_key = p_permission
  );
$$;

CREATE OR REPLACE FUNCTION public.write_audit_log(
  p_actor_id uuid,
  p_target_id uuid,
  p_action text,
  p_diff jsonb DEFAULT NULL,
  p_ip inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    actor_id,
    target_id,
    action,
    diff,
    ip_address,
    user_agent
  )
  VALUES (
    p_actor_id,
    p_target_id,
    p_action,
    p_diff,
    p_ip,
    p_user_agent
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.hash_reset_token(p_token text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public, extensions
AS $$
  SELECT encode(extensions.digest(convert_to(p_token, 'UTF8'), 'sha256'), 'hex');
$$;

CREATE OR REPLACE FUNCTION public.issue_password_reset_token(
  p_user_id uuid,
  p_created_by uuid DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_token text;
  v_hash text;
BEGIN
  UPDATE public.password_reset_tokens
  SET consumed_at = now()
  WHERE
    user_id = p_user_id
    AND consumed_at IS NULL;

  v_token := encode(extensions.gen_random_bytes(32), 'hex');
  v_hash := public.hash_reset_token(v_token);

  INSERT INTO public.password_reset_tokens (
    user_id,
    token_hash,
    expires_at,
    created_by
  )
  VALUES (
    p_user_id,
    v_hash,
    now() + interval '60 minutes',
    p_created_by
  );

  RETURN v_token;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_auth_instance_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = auth
AS $$
  SELECT COALESCE(
    (SELECT instance_id FROM auth.users LIMIT 1),
    '00000000-0000-0000-0000-000000000000'::uuid
  );
$$;

CREATE OR REPLACE FUNCTION public.admin_create_user(
  p_username text,
  p_role public.user_role,
  p_ip inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_user_id uuid;
  v_token text;
  v_email text;
  v_instance_id uuid;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  IF p_role = 'admin' THEN
    RAISE EXCEPTION 'cannot_create_admin';
  END IF;

  IF p_username !~ '^[a-zA-Z0-9]+$' THEN
    RAISE EXCEPTION 'invalid_username';
  END IF;

  IF p_username = 'admin' THEN
    RAISE EXCEPTION 'reserved_username';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.profiles WHERE username = p_username
  ) THEN
    RAISE EXCEPTION 'username_taken';
  END IF;

  v_email := public.username_to_email(p_username);
  v_user_id := gen_random_uuid();
  v_instance_id := public.get_auth_instance_id();

  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  )
  VALUES (
    v_user_id,
    v_instance_id,
    'authenticated',
    'authenticated',
    v_email,
    extensions.crypt(gen_random_uuid()::text, extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('username', p_username),
    now(),
    now()
  );

  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    gen_random_uuid(),
    v_user_id,
    jsonb_build_object(
      'sub',
      v_user_id::text,
      'email',
      v_email
    ),
    'email',
    v_user_id::text,
    now(),
    now(),
    now()
  );

  INSERT INTO public.profiles (id, username, role, status)
  VALUES (v_user_id, p_username, p_role, 'active');

  v_token := public.issue_password_reset_token(v_user_id, auth.uid());

  PERFORM public.write_audit_log(
    auth.uid(),
    v_user_id,
    'user.create',
    jsonb_build_object('username', p_username, 'role', p_role),
    p_ip,
    p_user_agent
  );

  RETURN jsonb_build_object(
    'user_id',
    v_user_id,
    'username',
    p_username,
    'reset_token',
    v_token
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_reset_user_password(
  p_user_id uuid,
  p_ip inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_username text;
  v_token text;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  SELECT username INTO v_username
  FROM public.profiles
  WHERE id = p_user_id;

  IF v_username IS NULL THEN
    RAISE EXCEPTION 'user_not_found';
  END IF;

  IF v_username = 'admin' THEN
    RAISE EXCEPTION 'cannot_reset_admin';
  END IF;

  v_token := public.issue_password_reset_token(p_user_id, auth.uid());

  PERFORM public.write_audit_log(
    auth.uid(),
    p_user_id,
    'user.password_reset_issue',
    jsonb_build_object('username', v_username),
    p_ip,
    p_user_agent
  );

  RETURN jsonb_build_object(
    'user_id',
    p_user_id,
    'username',
    v_username,
    'reset_token',
    v_token
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_user_status(
  p_user_id uuid,
  p_status public.user_status,
  p_ip inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_status public.user_status;
  v_username text;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  SELECT username, status
  INTO v_username, v_old_status
  FROM public.profiles
  WHERE id = p_user_id;

  IF v_username IS NULL THEN
    RAISE EXCEPTION 'user_not_found';
  END IF;

  IF v_username = 'admin' THEN
    RAISE EXCEPTION 'cannot_modify_admin';
  END IF;

  UPDATE public.profiles
  SET status = p_status
  WHERE id = p_user_id;

  PERFORM public.write_audit_log(
    auth.uid(),
    p_user_id,
    'user.status_update',
    jsonb_build_object(
      'username',
      v_username,
      'from',
      v_old_status,
      'to',
      p_status
    ),
    p_ip,
    p_user_agent
  );

  RETURN jsonb_build_object(
    'user_id',
    p_user_id,
    'username',
    v_username,
    'status',
    p_status
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_password_reset(
  p_token text,
  p_new_password text,
  p_ip inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_hash text;
  v_row public.password_reset_tokens%ROWTYPE;
  v_username text;
BEGIN
  IF length(p_new_password) < 8 THEN
    RAISE EXCEPTION 'password_too_short';
  END IF;

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

  UPDATE auth.users
  SET
    encrypted_password = extensions.crypt(p_new_password, extensions.gen_salt('bf')),
    updated_at = now()
  WHERE id = v_row.user_id;

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

CREATE OR REPLACE FUNCTION public.purge_expired_audit_logs()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_days integer;
  v_deleted integer;
BEGIN
  SELECT (value #>> '{}')::integer
  INTO v_days
  FROM public.app_settings
  WHERE key = 'audit_log_retention_days';

  v_days := COALESCE(v_days, 180);

  DELETE FROM public.audit_logs
  WHERE created_at < now() - make_interval(days => v_days);

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_select_own ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY profiles_select_admin ON public.profiles
FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY role_permissions_select ON public.role_permissions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE
      p.id = auth.uid()
      AND p.status = 'active'
      AND p.role = role_permissions.role
  )
  OR public.is_admin()
);

CREATE POLICY audit_logs_select_admin ON public.audit_logs
FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY app_settings_select_admin ON public.app_settings
FOR SELECT
TO authenticated
USING (public.is_admin());

-- No direct insert/update/delete on sensitive tables from clients; use RPCs.

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT ON public.role_permissions TO authenticated;
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT SELECT ON public.app_settings TO authenticated;

GRANT EXECUTE ON FUNCTION public.is_admin () TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_permission (text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_create_user (text, public.user_role, inet, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reset_user_password (uuid, inet, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_user_status (uuid, public.user_status, inet, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_password_reset (text, text, inet, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.username_to_email (text) TO authenticated, anon;
