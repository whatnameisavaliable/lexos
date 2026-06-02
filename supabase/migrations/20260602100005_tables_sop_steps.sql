-- M10: sop_steps (database.md §3.16.3)

CREATE TABLE public.sop_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_version_id UUID NOT NULL REFERENCES public.sop_template_versions (id) ON DELETE CASCADE,
  step_code VARCHAR(32) NOT NULL,
  name VARCHAR(256) NOT NULL,
  execution_type public.sop_execution_type NOT NULL,
  ai_feature_key public.ai_feature_key,
  prompt_template_id UUID REFERENCES public.ai_prompt_templates (id),
  input_schema JSONB NOT NULL DEFAULT '{}'::jsonb,
  depends_on JSONB NOT NULL DEFAULT '[]'::jsonb,
  requires_verification BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT sop_steps_template_version_step_code_unique
    UNIQUE (template_version_id, step_code)
);

CREATE INDEX sop_steps_template_version_id_idx
  ON public.sop_steps (template_version_id);
