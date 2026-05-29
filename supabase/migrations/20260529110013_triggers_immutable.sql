-- M0-B B13: immutable audit + profiles guard trigger (database.md §4.2.2, §4.12.1)

CREATE OR REPLACE FUNCTION public.audit_logs_deny_mutation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'audit_log_immutable';
END;
$$;

CREATE TRIGGER audit_logs_immutable
  BEFORE UPDATE OR DELETE ON public.audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_logs_deny_mutation();

CREATE TRIGGER profiles_guard_self_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.profiles_guard_self_update();
