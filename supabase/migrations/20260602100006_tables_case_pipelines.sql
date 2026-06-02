-- M10: case_pipelines (database.md §3.16.4)

CREATE TABLE public.case_pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lawyer_id UUID NOT NULL REFERENCES public.profiles (id),
  template_version_id UUID NOT NULL REFERENCES public.sop_template_versions (id),
  status public.case_pipeline_status NOT NULL DEFAULT 'in_progress',
  current_step_code VARCHAR(32),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX case_pipelines_lawyer_id_idx ON public.case_pipelines (lawyer_id);
CREATE INDEX case_pipelines_template_version_id_idx
  ON public.case_pipelines (template_version_id);
