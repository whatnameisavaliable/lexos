-- M11-A: ai_invocation_logs.metadata for SOP pipeline context (database.md §3.10)

ALTER TABLE public.ai_invocation_logs
  ADD COLUMN metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX ai_invocation_logs_metadata_gin_idx
  ON public.ai_invocation_logs
  USING gin (metadata jsonb_path_ops);
