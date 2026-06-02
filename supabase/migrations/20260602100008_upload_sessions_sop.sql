-- M10: upload_sessions SOP 卷宗 TUS 扩展 (architecture.md §3.2.6.8)

ALTER TABLE public.upload_sessions
  ALTER COLUMN task_id DROP NOT NULL;

ALTER TABLE public.upload_sessions
  ADD COLUMN pipeline_id UUID NULL REFERENCES public.case_pipelines (id) ON DELETE CASCADE;

ALTER TABLE public.upload_sessions
  ADD CONSTRAINT upload_sessions_task_or_pipeline_chk
  CHECK (
    (task_id IS NOT NULL AND pipeline_id IS NULL)
    OR (task_id IS NULL AND pipeline_id IS NOT NULL)
  );

CREATE INDEX upload_sessions_pipeline_id_idx
  ON public.upload_sessions (pipeline_id);
