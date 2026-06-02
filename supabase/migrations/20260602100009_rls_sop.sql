-- M10: SOP RLS policies (database.md §3.16.6)

ALTER TABLE public.sop_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sop_template_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sop_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_artifacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY sop_templates_admin ON public.sop_templates
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY sop_template_versions_admin ON public.sop_template_versions
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY sop_steps_admin ON public.sop_steps
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY sop_templates_lawyer_select ON public.sop_templates
  FOR SELECT
  USING (
    public.is_enabled_user()
    AND public.current_user_role() = 'lawyer'
    AND EXISTS (
      SELECT 1 FROM public.sop_template_versions v
      WHERE v.template_id = sop_templates.id
        AND v.is_published = true
    )
  );

CREATE POLICY sop_template_versions_lawyer_select ON public.sop_template_versions
  FOR SELECT
  USING (
    public.is_enabled_user()
    AND public.current_user_role() = 'lawyer'
    AND is_published = true
  );

CREATE POLICY sop_steps_lawyer_select ON public.sop_steps
  FOR SELECT
  USING (
    public.is_enabled_user()
    AND public.current_user_role() = 'lawyer'
    AND EXISTS (
      SELECT 1 FROM public.sop_template_versions v
      WHERE v.id = sop_steps.template_version_id
        AND v.is_published = true
    )
  );

CREATE POLICY case_pipelines_lawyer ON public.case_pipelines
  FOR ALL
  USING (
    lawyer_id = auth.uid()
    AND public.is_enabled_user()
  )
  WITH CHECK (
    lawyer_id = auth.uid()
    AND public.is_enabled_user()
  );

CREATE POLICY pipeline_artifacts_lawyer ON public.pipeline_artifacts
  FOR ALL
  USING (
    public.is_enabled_user()
    AND EXISTS (
      SELECT 1 FROM public.case_pipelines p
      WHERE p.id = pipeline_artifacts.pipeline_id
        AND p.lawyer_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_enabled_user()
    AND EXISTS (
      SELECT 1 FROM public.case_pipelines p
      WHERE p.id = pipeline_artifacts.pipeline_id
        AND p.lawyer_id = auth.uid()
    )
  );
