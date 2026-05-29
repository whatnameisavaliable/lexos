-- M0-B B9: audit_logs, ai_invocation_logs, system_settings (database.md §3.10–§3.12)

CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles (id),
  action public.audit_action NOT NULL,
  target_type VARCHAR(64),
  target_id UUID,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  prev_hash CHAR(64),
  row_hash CHAR(64) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX audit_logs_created_at_idx ON public.audit_logs (created_at DESC);
CREATE INDEX audit_logs_actor_id_idx ON public.audit_logs (actor_id);

REVOKE UPDATE, DELETE ON public.audit_logs FROM PUBLIC;
REVOKE UPDATE, DELETE ON public.audit_logs FROM authenticated;
REVOKE UPDATE, DELETE ON public.audit_logs FROM service_role;

CREATE TABLE public.ai_invocation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES public.transcription_tasks (id),
  feature_key public.ai_feature_key NOT NULL,
  model_id UUID NOT NULL REFERENCES public.ai_model_credentials (id),
  is_fallback BOOLEAN NOT NULL,
  input_tokens INTEGER,
  output_tokens INTEGER,
  latency_ms INTEGER NOT NULL,
  outcome VARCHAR(16) NOT NULL,
  error_code VARCHAR(64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ai_invocation_logs_task_id_idx ON public.ai_invocation_logs (task_id);

CREATE TABLE public.system_settings (
  key VARCHAR(128) PRIMARY KEY,
  value JSONB NOT NULL,
  updated_by UUID REFERENCES public.profiles (id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER system_settings_set_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
