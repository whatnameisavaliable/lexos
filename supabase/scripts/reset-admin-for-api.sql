-- Run in Supabase SQL Editor if `npm run setup:admin` reports
-- "Database error loading user" or "Database error checking email".
-- Then run: npm run setup:admin

DELETE FROM public.password_reset_tokens
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'admin@lexos.internal'
);

DELETE FROM public.profiles WHERE username = 'admin';

DELETE FROM auth.identities
WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'admin@lexos.internal');

DELETE FROM auth.users WHERE email = 'admin@lexos.internal';
