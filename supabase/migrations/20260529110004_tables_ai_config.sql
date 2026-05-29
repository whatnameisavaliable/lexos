-- M0-B B4: AI configuration tables (database.md §3.7–§3.9)

CREATE TABLE public.ai_model_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(128) NOT NULL,
  provider_kind public.ai_provider_kind NOT NULL,
  model_name VARCHAR(128) NOT NULL,
  model_id VARCHAR(256) NOT NULL,
  api_key_ciphertext TEXT NOT NULL,
  base_url TEXT,
  context_window INTEGER,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  is_default_fallback BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL REFERENCES public.profiles (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX ai_model_credentials_default_fallback_uidx
  ON public.ai_model_credentials (is_default_fallback)
  WHERE is_default_fallback = true;

CREATE TRIGGER ai_model_credentials_set_updated_at
  BEFORE UPDATE ON public.ai_model_credentials
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.ai_feature_model_mappings (
  feature_key public.ai_feature_key PRIMARY KEY,
  primary_model_id UUID NOT NULL REFERENCES public.ai_model_credentials (id),
  fallback_model_id UUID REFERENCES public.ai_model_credentials (id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER ai_feature_model_mappings_set_updated_at
  BEFORE UPDATE ON public.ai_feature_model_mappings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.ai_prompt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key public.ai_feature_key NOT NULL,
  name VARCHAR(128) NOT NULL,
  system_prompt TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL REFERENCES public.profiles (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ai_prompt_templates_feature_published_idx
  ON public.ai_prompt_templates (feature_key, is_published, version DESC);

CREATE TRIGGER ai_prompt_templates_set_updated_at
  BEFORE UPDATE ON public.ai_prompt_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
