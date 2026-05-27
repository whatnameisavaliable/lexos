-- Remove SQL-seeded admin so Auth Admin API can recreate a valid GoTrue user.
-- After this migration: run `npm run setup:admin` locally.

DELETE FROM public.password_reset_tokens
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'admin@lexos.internal'
);

DELETE FROM public.audit_logs
WHERE actor_id IN (SELECT id FROM auth.users WHERE email = 'admin@lexos.internal')
   OR target_id IN (SELECT id FROM auth.users WHERE email = 'admin@lexos.internal');

DELETE FROM public.profiles
WHERE username = 'admin'
   OR id = '00000000-0000-0000-0000-000000000001'::uuid;

DELETE FROM auth.identities
WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'admin@lexos.internal')
   OR user_id = '00000000-0000-0000-0000-000000000001'::uuid;

DELETE FROM auth.users
WHERE email = 'admin@lexos.internal'
   OR id = '00000000-0000-0000-0000-000000000001'::uuid;
