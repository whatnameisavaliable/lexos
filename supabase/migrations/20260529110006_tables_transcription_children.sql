-- M0-B B6: transcription_segments + transcription_transcripts (database.md §3.3–§3.4)

CREATE TABLE public.transcription_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.transcription_tasks (id) ON DELETE CASCADE,
  segment_index INTEGER NOT NULL,
  start_ms INTEGER NOT NULL,
  end_ms INTEGER NOT NULL,
  storage_key TEXT,
  local_path_hint TEXT,
  chunk_size_bytes BIGINT,
  asr_text TEXT,
  speaker_label VARCHAR(32),
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT transcription_segments_task_segment_unique UNIQUE (task_id, segment_index)
);

CREATE INDEX transcription_segments_task_id_idx
  ON public.transcription_segments (task_id);

CREATE TABLE public.transcription_transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL UNIQUE REFERENCES public.transcription_tasks (id) ON DELETE CASCADE,
  asr_raw_json JSONB,
  polished_text TEXT,
  summary_text TEXT,
  search_vector TSVECTOR,
  version INTEGER NOT NULL DEFAULT 1,
  updated_by UUID REFERENCES public.profiles (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX transcription_transcripts_polished_trgm_idx
  ON public.transcription_transcripts USING gin (polished_text gin_trgm_ops);

CREATE INDEX transcription_transcripts_summary_trgm_idx
  ON public.transcription_transcripts USING gin (summary_text gin_trgm_ops);

CREATE TRIGGER transcription_transcripts_set_updated_at
  BEFORE UPDATE ON public.transcription_transcripts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
