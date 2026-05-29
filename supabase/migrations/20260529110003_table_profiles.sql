-- M0-B B3: profiles (database.md §3.1)

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE RESTRICT,
  username VARCHAR(64) NOT NULL,
  display_name VARCHAR(128) NOT NULL,
  role public.user_role NOT NULL,
  contact VARCHAR(256),
  status public.user_status NOT NULL DEFAULT 'enabled',
  requires_password_change BOOLEAN NOT NULL DEFAULT false,
  mfa_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT profiles_username_unique UNIQUE (username)
);

CREATE INDEX profiles_role_idx ON public.profiles (role);
CREATE INDEX profiles_status_idx ON public.profiles (status);
CREATE INDEX profiles_mfa_enabled_idx ON public.profiles (mfa_enabled)
  WHERE mfa_enabled = true;

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
