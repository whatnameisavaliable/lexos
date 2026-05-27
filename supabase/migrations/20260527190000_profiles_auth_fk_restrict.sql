-- Deleting auth.users must not CASCADE-delete profiles (repair flow keeps profile).

ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_id_fkey;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_id_fkey
FOREIGN KEY (id) REFERENCES auth.users (id) ON DELETE RESTRICT;

-- Legacy repair RPC deleted auth.users and wiped profiles; keep for compatibility but no-op.
CREATE OR REPLACE FUNCTION public.cleanup_auth_user_for_repair(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  DELETE FROM public.password_reset_tokens
  WHERE user_id = p_user_id;
END;
$$;
