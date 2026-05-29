-- Fix: service_role AdminRepository 更新 profiles.status 时不应触发 profiles_escalation_denied
-- （auth.uid() 为空；current_user_role() 非 admin）

CREATE OR REPLACE FUNCTION public.profiles_guard_self_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- BFF service_role 跨用户维护（AdminRepository / SECURITY DEFINER RPC）
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

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
