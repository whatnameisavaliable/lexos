-- GoTrue email login requires identities.provider_id = user email (not user uuid).
-- Also re-hash built-in admin password for environments seeded with the old script.

-- ---------------------------------------------------------------------------
-- 1) Repair existing email identities
-- ---------------------------------------------------------------------------
UPDATE auth.identities AS i
SET
  provider_id = u.email,
  identity_data = jsonb_build_object(
    'sub', u.id::text,
    'email', u.email,
    'email_verified', true
  ),
  updated_at = now()
FROM auth.users AS u
WHERE
  i.user_id = u.id
  AND i.provider = 'email'
  AND i.provider_id IS DISTINCT FROM u.email;

-- ---------------------------------------------------------------------------
-- 2) Ensure built-in admin can sign in (admin / 111111)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_user_id uuid := '00000000-0000-0000-0000-000000000001';
  v_instance_id uuid;
  v_email text := 'admin@lexos.internal';
BEGIN
  SELECT COALESCE(
    (SELECT instance_id FROM auth.users LIMIT 1),
    '00000000-0000-0000-0000-000000000000'::uuid
  )
  INTO v_instance_id;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = v_email) THEN
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
      extensions.crypt('111111', extensions.gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"username":"admin"}'::jsonb,
      now(),
      now()
    );
  ELSE
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_email LIMIT 1;

    UPDATE auth.users
    SET
      encrypted_password = extensions.crypt('111111', extensions.gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      updated_at = now()
    WHERE id = v_user_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM auth.identities
    WHERE user_id = v_user_id AND provider = 'email'
  ) THEN
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
        'sub', v_user_id::text,
        'email', v_email,
        'email_verified', true
      ),
      'email',
      v_email,
      now(),
      now(),
      now()
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE username = 'admin') THEN
    INSERT INTO public.profiles (id, username, role, status)
    VALUES (v_user_id, 'admin', 'admin', 'active');
  END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- 3) Fix admin_create_user identity provider_id for future users
-- ---------------------------------------------------------------------------
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
      v_email,
      'email_verified',
      true
    ),
    'email',
    v_email,
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
