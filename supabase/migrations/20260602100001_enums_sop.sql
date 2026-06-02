-- M10: SOP enum types (database.md §1.2, §3.16.3–§3.16.5)

CREATE TYPE public.sop_execution_type AS ENUM (
  'sync_llm',
  'async_deep_research',
  'manual'
);

CREATE TYPE public.case_pipeline_status AS ENUM (
  'in_progress',
  'completed',
  'suspended'
);

CREATE TYPE public.pipeline_artifact_status AS ENUM (
  'running',
  'draft',
  'failed',
  'finalized'
);

CREATE TYPE public.artifact_content_type AS ENUM (
  'markdown',
  'html',
  'json'
);

ALTER TYPE public.ai_feature_key ADD VALUE IF NOT EXISTS 'sop.fact_extract';
ALTER TYPE public.ai_feature_key ADD VALUE IF NOT EXISTS 'sop.strategy_gen';
ALTER TYPE public.ai_feature_key ADD VALUE IF NOT EXISTS 'sop.deep_research';
ALTER TYPE public.ai_feature_key ADD VALUE IF NOT EXISTS 'sop.visual_charting';
