-- M0-B B11: business rule triggers (database.md §7.1)
-- profiles: created via Admin API (M2); no auth.users trigger in M0.

CREATE OR REPLACE FUNCTION public.transcription_tasks_validate_limits()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.size_bytes > 1073741824 THEN
    RAISE EXCEPTION 'transcription_task_size_limit_exceeded';
  END IF;

  IF NEW.duration_sec IS NOT NULL AND NEW.duration_sec > 18000 THEN
    RAISE EXCEPTION 'transcription_task_duration_limit_exceeded';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER transcription_tasks_validate_limits
  BEFORE INSERT OR UPDATE OF size_bytes, duration_sec ON public.transcription_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.transcription_tasks_validate_limits();
