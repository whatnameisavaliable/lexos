-- M10: pipeline_artifacts (database.md §3.16.5)

CREATE TABLE public.pipeline_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID NOT NULL REFERENCES public.case_pipelines (id) ON DELETE CASCADE,
  step_code VARCHAR(32) NOT NULL,
  content_type public.artifact_content_type NOT NULL,
  content_raw TEXT NOT NULL DEFAULT '',
  version INTEGER NOT NULL DEFAULT 1,
  status public.pipeline_artifact_status NOT NULL,
  linked_drive_node_id UUID REFERENCES public.drive_nodes (id),
  finalized_snapshot_raw TEXT,
  updated_by UUID REFERENCES public.profiles (id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT pipeline_artifacts_pipeline_step_unique
    UNIQUE (pipeline_id, step_code)
);

CREATE INDEX pipeline_artifacts_pipeline_id_idx
  ON public.pipeline_artifacts (pipeline_id);

CREATE TRIGGER pipeline_artifacts_set_updated_at
  BEFORE UPDATE ON public.pipeline_artifacts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
