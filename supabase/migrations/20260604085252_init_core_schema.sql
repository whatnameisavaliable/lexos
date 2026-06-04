-- =============================================================================
-- 律所协同AI办公平台 - 核心业务实体初始化与 RLS 策略
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. 核心业务表
-- ---------------------------------------------------------------------------

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'lawyer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.ai_model_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  model_name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.legal_sops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  case_type TEXT,
  data_region TEXT NOT NULL DEFAULT 'mainland',
  content_schema JSONB,
  created_by UUID NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT legal_sops_data_region_check CHECK (data_region IN ('mainland', 'hongkong'))
);

CREATE TABLE public.legal_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sop_id UUID NOT NULL REFERENCES public.legal_sops (id) ON DELETE CASCADE,
  assignee_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'pending',
  risk_control_status TEXT NOT NULL DEFAULT 'unverified',
  ai_insights JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  resource_id TEXT,
  context JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 2. 索引（外键与常用查询列）
-- ---------------------------------------------------------------------------

CREATE INDEX idx_ai_model_configs_created_by ON public.ai_model_configs (created_by);
CREATE INDEX idx_ai_model_configs_is_active ON public.ai_model_configs (is_active) WHERE is_active = true;

CREATE INDEX idx_legal_sops_created_by ON public.legal_sops (created_by);
CREATE INDEX idx_legal_sops_data_region ON public.legal_sops (data_region);

CREATE INDEX idx_legal_tasks_sop_id ON public.legal_tasks (sop_id);
CREATE INDEX idx_legal_tasks_assignee_id ON public.legal_tasks (assignee_id);
CREATE INDEX idx_legal_tasks_status ON public.legal_tasks (status);

CREATE INDEX idx_audit_logs_operator_id ON public.audit_logs (operator_id);
CREATE INDEX idx_audit_logs_action_type ON public.audit_logs (action_type);

-- ---------------------------------------------------------------------------
-- 3. updated_at 自动刷新触发器（前 4 张业务表，不含 audit_logs）
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.update_modified_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_modified_column();

CREATE TRIGGER set_ai_model_configs_updated_at
  BEFORE UPDATE ON public.ai_model_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_modified_column();

CREATE TRIGGER set_legal_sops_updated_at
  BEFORE UPDATE ON public.legal_sops
  FOR EACH ROW
  EXECUTE FUNCTION public.update_modified_column();

CREATE TRIGGER set_legal_tasks_updated_at
  BEFORE UPDATE ON public.legal_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_modified_column();

-- ---------------------------------------------------------------------------
-- 4. Row Level Security (RLS)
-- ---------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_model_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_sops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- profiles: 用户仅能查看与更新自己的数据
CREATE POLICY profiles_select_own
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = id);

CREATE POLICY profiles_update_own
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

-- ai_model_configs: 认证用户可读活跃配置；创建者可更新/删除
CREATE POLICY ai_model_configs_select_active
  ON public.ai_model_configs
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY ai_model_configs_select_own
  ON public.ai_model_configs
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = created_by);

CREATE POLICY ai_model_configs_insert_own
  ON public.ai_model_configs
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = created_by);

CREATE POLICY ai_model_configs_update_own
  ON public.ai_model_configs
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = created_by)
  WITH CHECK ((SELECT auth.uid()) = created_by);

CREATE POLICY ai_model_configs_delete_own
  ON public.ai_model_configs
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = created_by);

-- legal_sops: 创建者拥有全量 CRUD
CREATE POLICY legal_sops_select_own
  ON public.legal_sops
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = created_by);

CREATE POLICY legal_sops_insert_own
  ON public.legal_sops
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = created_by);

CREATE POLICY legal_sops_update_own
  ON public.legal_sops
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = created_by)
  WITH CHECK ((SELECT auth.uid()) = created_by);

CREATE POLICY legal_sops_delete_own
  ON public.legal_sops
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = created_by);

-- legal_tasks: 分配者拥有全量 CRUD
CREATE POLICY legal_tasks_select_assignee
  ON public.legal_tasks
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = assignee_id);

CREATE POLICY legal_tasks_insert_assignee
  ON public.legal_tasks
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = assignee_id);

CREATE POLICY legal_tasks_update_assignee
  ON public.legal_tasks
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = assignee_id)
  WITH CHECK ((SELECT auth.uid()) = assignee_id);

CREATE POLICY legal_tasks_delete_assignee
  ON public.legal_tasks
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = assignee_id);

-- audit_logs: 仅 INSERT；SELECT 限操作者本人；禁止 UPDATE/DELETE
CREATE POLICY audit_logs_insert_authenticated
  ON public.audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    operator_id IS NULL
    OR (SELECT auth.uid()) = operator_id
  );

CREATE POLICY audit_logs_select_own
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = operator_id);

-- ---------------------------------------------------------------------------
-- 5. 权限收紧：禁止 anon 对业务表执行写操作
-- ---------------------------------------------------------------------------

REVOKE INSERT, UPDATE, DELETE ON public.profiles FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.ai_model_configs FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.legal_sops FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.legal_tasks FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.audit_logs FROM anon;

REVOKE UPDATE, DELETE ON public.audit_logs FROM authenticated;
