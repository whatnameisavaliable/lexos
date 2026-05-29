-- M0-B B5: transcription_tasks (database.md §3.2; archive_folder_id FK deferred to B7)

CREATE TABLE public.transcription_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES public.profiles (id),
  title VARCHAR(256) NOT NULL,
  status public.transcription_task_status NOT NULL DEFAULT 'uploading',
  source_mime VARCHAR(128) NOT NULL,
  source_storage_key TEXT NOT NULL,
  audio_storage_key TEXT,
  duration_sec INTEGER,
  size_bytes BIGINT NOT NULL,
  is_mp4 BOOLEAN NOT NULL DEFAULT false,
  diarization_degraded BOOLEAN NOT NULL DEFAULT false,
  error_code VARCHAR(64),
  error_message TEXT,
  archive_folder_id UUID,
  idempotency_key VARCHAR(128),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status_changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_progress_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  asr_queue_tier public.asr_queue_tier,
  retry_count INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX transcription_tasks_created_by_created_at_idx
  ON public.transcription_tasks (created_by, created_at DESC);

CREATE INDEX transcription_tasks_status_idx
  ON public.transcription_tasks (status)
  WHERE deleted_at IS NULL;

CREATE INDEX transcription_tasks_stalled_idx
  ON public.transcription_tasks (last_progress_at)
  WHERE status IN (
    'extracting', 'preprocessing', 'asr_running', 'llm_running'
  )
  AND deleted_at IS NULL;

CREATE UNIQUE INDEX transcription_tasks_idempotency_key_uidx
  ON public.transcription_tasks (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE TRIGGER transcription_tasks_set_updated_at
  BEFORE UPDATE ON public.transcription_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
