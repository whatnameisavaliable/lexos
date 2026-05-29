-- M0-B B2: enum types (database.md §1.2)

CREATE TYPE public.user_role AS ENUM (
  'admin', 'lawyer', 'director', 'client', 'channel'
);

CREATE TYPE public.user_status AS ENUM (
  'enabled', 'disabled'
);

CREATE TYPE public.transcription_task_status AS ENUM (
  'uploading',
  'queued',
  'extracting',
  'preprocessing',
  'asr_running',
  'llm_running',
  'completed',
  'failed'
);

CREATE TYPE public.ai_provider_kind AS ENUM (
  'openai_compatible',
  'azure_openai',
  'custom_http'
);

CREATE TYPE public.ai_feature_key AS ENUM (
  'asr_physical',
  'asr_semantic',
  'llm_transcript_polish',
  'llm_legal_summary'
);

CREATE TYPE public.drive_node_type AS ENUM (
  'folder', 'file'
);

CREATE TYPE public.asr_queue_tier AS ENUM (
  'express',
  'batch'
);

CREATE TYPE public.audit_action AS ENUM (
  'auth.login_success',
  'auth.login_failure',
  'auth.logout',
  'auth.password_change',
  'auth.password_reset',
  'user.create',
  'user.update',
  'user.disable',
  'user.enable',
  'ai.model.upsert',
  'ai.mapping.upsert',
  'ai.prompt.publish',
  'task.create',
  'task.complete',
  'task.fail',
  'file.download',
  'file.delete',
  'file.export'
);
