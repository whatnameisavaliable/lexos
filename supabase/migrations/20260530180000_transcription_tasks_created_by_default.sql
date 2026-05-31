-- 插入时若未显式传 created_by，默认 auth.uid()（与 RLS tasks_insert 一致）

ALTER TABLE public.transcription_tasks
  ALTER COLUMN created_by SET DEFAULT auth.uid();
