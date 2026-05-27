-- is_admin() must bypass RLS when reading profiles (avoid policy recursion).

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM set_config('row_security', 'off', true);
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE
      id = auth.uid()
      AND role = 'admin'
      AND username = 'admin'
      AND status = 'active'
  );
END;
$$;
