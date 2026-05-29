-- M0-B B12: RLS policies (database.md §4.2–§4.10)

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_select_self ON public.profiles
  FOR SELECT
  USING (id = auth.uid() AND public.is_enabled_user());

CREATE POLICY profiles_select_admin ON public.profiles
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY profiles_update_self ON public.profiles
  FOR UPDATE
  USING (id = auth.uid() AND public.is_enabled_user())
  WITH CHECK (id = auth.uid());

CREATE POLICY profiles_write_admin ON public.profiles
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

ALTER TABLE public.transcription_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY tasks_select ON public.transcription_tasks
  FOR SELECT
  USING (
    deleted_at IS NULL
    AND (
      (created_by = auth.uid() AND public.is_enabled_user())
      OR public.is_admin()
    )
  );

CREATE POLICY tasks_insert ON public.transcription_tasks
  FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND public.is_enabled_user()
    AND public.current_user_role() IN ('lawyer', 'admin')
  );

CREATE POLICY tasks_update ON public.transcription_tasks
  FOR UPDATE
  USING (
    deleted_at IS NULL
    AND (
      (created_by = auth.uid() AND public.is_enabled_user())
      OR public.is_admin()
    )
  );

ALTER TABLE public.transcription_segments ENABLE ROW LEVEL SECURITY;

CREATE POLICY segments_select ON public.transcription_segments
  FOR SELECT
  USING (
    public.is_enabled_user()
    AND EXISTS (
      SELECT 1 FROM public.transcription_tasks t
      WHERE t.id = task_id
        AND t.deleted_at IS NULL
        AND (t.created_by = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY segments_insert_lawyer ON public.transcription_segments
  FOR INSERT
  WITH CHECK (
    public.is_enabled_user()
    AND EXISTS (
      SELECT 1 FROM public.transcription_tasks t
      WHERE t.id = task_id
        AND t.deleted_at IS NULL
        AND t.created_by = auth.uid()
    )
  );

ALTER TABLE public.transcription_transcripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY transcripts_select ON public.transcription_transcripts
  FOR SELECT
  USING (
    public.is_enabled_user()
    AND EXISTS (
      SELECT 1 FROM public.transcription_tasks t
      WHERE t.id = task_id
        AND t.deleted_at IS NULL
        AND (t.created_by = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY transcripts_insert ON public.transcription_transcripts
  FOR INSERT
  WITH CHECK (
    public.is_enabled_user()
    AND EXISTS (
      SELECT 1 FROM public.transcription_tasks t
      WHERE t.id = task_id
        AND t.deleted_at IS NULL
        AND t.created_by = auth.uid()
    )
  );

CREATE POLICY transcripts_update ON public.transcription_transcripts
  FOR UPDATE
  USING (
    public.is_enabled_user()
    AND EXISTS (
      SELECT 1 FROM public.transcription_tasks t
      WHERE t.id = task_id
        AND t.deleted_at IS NULL
        AND (t.created_by = auth.uid() OR public.is_admin())
    )
  );

ALTER TABLE public.drive_nodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY drive_select ON public.drive_nodes
  FOR SELECT
  USING (
    deleted_at IS NULL
    AND (
      (created_by = auth.uid() AND public.is_enabled_user())
      OR public.is_admin()
    )
  );

CREATE POLICY drive_write ON public.drive_nodes
  FOR ALL
  USING (
    created_by = auth.uid()
    AND public.is_enabled_user()
    AND public.current_user_role() IN ('lawyer', 'admin')
  )
  WITH CHECK (created_by = auth.uid());

ALTER TABLE public.ai_model_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_feature_model_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_prompt_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY ai_model_credentials_admin ON public.ai_model_credentials
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY ai_feature_model_mappings_admin ON public.ai_feature_model_mappings
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY ai_prompt_templates_admin ON public.ai_prompt_templates
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_select_admin ON public.audit_logs
  FOR SELECT
  USING (public.is_admin());

ALTER TABLE public.ai_invocation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY ai_invocation_logs_select_admin ON public.ai_invocation_logs
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY ai_invocation_logs_select_lawyer ON public.ai_invocation_logs
  FOR SELECT
  USING (
    public.is_enabled_user()
    AND public.current_user_role() = 'lawyer'
    AND EXISTS (
      SELECT 1 FROM public.transcription_tasks t
      WHERE t.id = task_id AND t.created_by = auth.uid()
    )
  );

ALTER TABLE public.upload_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY upload_sessions_select ON public.upload_sessions
  FOR SELECT
  USING (owner_id = auth.uid() AND public.is_enabled_user());

CREATE POLICY upload_sessions_insert ON public.upload_sessions
  FOR INSERT
  WITH CHECK (owner_id = auth.uid() AND public.is_enabled_user());

ALTER TABLE public.outbox_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_job_runs ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.outbox_events FROM authenticated;
REVOKE ALL ON public.pipeline_job_runs FROM authenticated;

GRANT ALL ON public.outbox_events TO service_role;
GRANT ALL ON public.pipeline_job_runs TO service_role;

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY system_settings_admin ON public.system_settings
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
