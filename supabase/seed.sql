-- Seed built-in admin (password: 111111). Run after migrations on fresh DB.
-- Local: supabase db reset | Remote: run once via SQL editor after db push

DO $$
DECLARE
  v_user_id uuid := '00000000-0000-0000-0000-000000000001';
  v_instance_id uuid;
  v_email text := 'admin@lexos.internal';
BEGIN
  IF EXISTS (SELECT 1 FROM public.profiles WHERE username = 'admin') THEN
    RETURN;
  END IF;

  SELECT COALESCE(
    (SELECT instance_id FROM auth.users LIMIT 1),
    '00000000-0000-0000-0000-000000000000'::uuid
  )
  INTO v_instance_id;

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
  VALUES (v_user_id, 'admin', 'admin', 'active');
END;
$$;
