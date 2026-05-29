-- M0-B B8: upload_sessions, outbox_events, pipeline_job_runs (database.md §3.13–§3.15)

CREATE TABLE public.upload_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.transcription_tasks (id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES public.profiles (id),
  storage_key_prefix TEXT NOT NULL,
  expected_max_bytes BIGINT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX upload_sessions_task_id_idx ON public.upload_sessions (task_id);

CREATE INDEX upload_sessions_expires_at_idx
  ON public.upload_sessions (expires_at)
  WHERE completed_at IS NULL;

CREATE TABLE public.outbox_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aggregate_type VARCHAR(64) NOT NULL,
  aggregate_id UUID NOT NULL,
  event_type VARCHAR(64) NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ,
  publish_attempts INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX outbox_events_unpublished_idx
  ON public.outbox_events (created_at)
  WHERE published_at IS NULL;

CREATE TABLE public.pipeline_job_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_name VARCHAR(64) NOT NULL,
  bull_job_id VARCHAR(128) NOT NULL,
  attempt INTEGER NOT NULL,
  task_id UUID REFERENCES public.transcription_tasks (id),
  status VARCHAR(16) NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  finished_at TIMESTAMPTZ,
  CONSTRAINT pipeline_job_runs_queue_job_attempt_unique
    UNIQUE (queue_name, bull_job_id, attempt)
);
