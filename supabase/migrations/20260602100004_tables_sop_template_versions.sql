-- M10: sop_template_versions (database.md §3.16.2)

CREATE TABLE public.sop_template_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.sop_templates (id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES public.profiles (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT sop_template_versions_template_version_unique
    UNIQUE (template_id, version_number)
);

CREATE INDEX sop_template_versions_template_id_idx
  ON public.sop_template_versions (template_id);
