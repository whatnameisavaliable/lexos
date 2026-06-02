-- PRD-2-06: admin 不可读取律师业务数据；移除 business 表 RLS 中的 is_admin() 读路径

DROP POLICY IF EXISTS tasks_select ON public.transcription_tasks;
CREATE POLICY tasks_select ON public.transcription_tasks
  FOR SELECT
  USING (
    deleted_at IS NULL
    AND created_by = auth.uid()
    AND public.is_enabled_user()
  );

DROP POLICY IF EXISTS tasks_insert ON public.transcription_tasks;
CREATE POLICY tasks_insert ON public.transcription_tasks
  FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND public.is_enabled_user()
    AND public.current_user_role() = 'lawyer'
  );

DROP POLICY IF EXISTS tasks_update ON public.transcription_tasks;
CREATE POLICY tasks_update ON public.transcription_tasks
  FOR UPDATE
  USING (
    deleted_at IS NULL
    AND created_by = auth.uid()
    AND public.is_enabled_user()
  );

DROP POLICY IF EXISTS segments_select ON public.transcription_segments;
CREATE POLICY segments_select ON public.transcription_segments
  FOR SELECT
  USING (
    public.is_enabled_user()
    AND EXISTS (
      SELECT 1 FROM public.transcription_tasks t
      WHERE t.id = task_id
        AND t.deleted_at IS NULL
        AND t.created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS transcripts_select ON public.transcription_transcripts;
CREATE POLICY transcripts_select ON public.transcription_transcripts
  FOR SELECT
  USING (
    public.is_enabled_user()
    AND EXISTS (
      SELECT 1 FROM public.transcription_tasks t
      WHERE t.id = task_id
        AND t.deleted_at IS NULL
        AND t.created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS transcripts_update ON public.transcription_transcripts;
CREATE POLICY transcripts_update ON public.transcription_transcripts
  FOR UPDATE
  USING (
    public.is_enabled_user()
    AND EXISTS (
      SELECT 1 FROM public.transcription_tasks t
      WHERE t.id = task_id
        AND t.deleted_at IS NULL
        AND t.created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS drive_select ON public.drive_nodes;
CREATE POLICY drive_select ON public.drive_nodes
  FOR SELECT
  USING (
    deleted_at IS NULL
    AND created_by = auth.uid()
    AND public.is_enabled_user()
  );

DROP POLICY IF EXISTS drive_write ON public.drive_nodes;
CREATE POLICY drive_write ON public.drive_nodes
  FOR ALL
  USING (
    created_by = auth.uid()
    AND public.is_enabled_user()
    AND public.current_user_role() = 'lawyer'
  )
  WITH CHECK (created_by = auth.uid());
