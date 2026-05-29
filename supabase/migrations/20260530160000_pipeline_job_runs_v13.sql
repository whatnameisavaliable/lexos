-- M5-0: Align pipeline_job_runs to database.md v1.4 §3.14 (stage + outbox_event_id)

-- Legacy bull_job_id values were BullMQ job keys (non-UUID); purge before schema change.
DELETE FROM public.pipeline_job_runs;

ALTER TABLE public.pipeline_job_runs
  DROP CONSTRAINT IF EXISTS pipeline_job_runs_queue_job_attempt_unique;

ALTER TABLE public.pipeline_job_runs
  RENAME COLUMN queue_name TO stage;

ALTER TABLE public.pipeline_job_runs
  RENAME COLUMN bull_job_id TO outbox_event_id;

ALTER TABLE public.pipeline_job_runs
  ALTER COLUMN outbox_event_id TYPE UUID USING outbox_event_id::uuid;

ALTER TABLE public.pipeline_job_runs
  ADD CONSTRAINT pipeline_job_runs_outbox_event_id_fkey
  FOREIGN KEY (outbox_event_id) REFERENCES public.outbox_events (id) ON DELETE CASCADE;

ALTER TABLE public.pipeline_job_runs
  ADD CONSTRAINT pipeline_job_runs_stage_outbox_attempt_unique
  UNIQUE (stage, outbox_event_id, attempt);
