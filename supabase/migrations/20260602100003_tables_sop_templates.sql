-- M10: sop_templates (database.md §3.16.1)

CREATE TABLE public.sop_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(256) NOT NULL,
  case_type VARCHAR(64) NOT NULL,
  created_by UUID NOT NULL REFERENCES public.profiles (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX sop_templates_created_by_idx ON public.sop_templates (created_by);
