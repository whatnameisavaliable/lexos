import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** `case_pipelines` 行摘要（RLS 测试用）。 */
export interface CasePipelineRow {
  readonly id: string;
  readonly lawyer_id: string;
  readonly status: string;
}

/** Supabase 表名常量（测试断言用）。 */
export const CASE_PIPELINES_TABLE = "case_pipelines" as const;

/** Supabase 表名常量（测试断言用）。 */
export const PIPELINE_ARTIFACTS_TABLE = "pipeline_artifacts" as const;

/**
 * 以指定用户 JWT 查询 `case_pipelines`（受 RLS 约束）。
 */
export async function fetchCasePipelineAsUser(
  supabaseUrl: string,
  supabaseAnonKey: string,
  accessToken: string,
  pipelineId: string,
): Promise<{ data: CasePipelineRow | null; error: { message: string } | null }> {
  const client: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await client
    .from(CASE_PIPELINES_TABLE)
    .select("id, lawyer_id, status")
    .eq("id", pipelineId)
    .maybeSingle();

  return {
    data: data as CasePipelineRow | null,
    error: error ? { message: error.message } : null,
  };
}

/**
 * 以指定用户 JWT 查询 `pipeline_artifacts`。
 */
export async function fetchPipelineArtifactAsUser(
  supabaseUrl: string,
  supabaseAnonKey: string,
  accessToken: string,
  artifactId: string,
): Promise<{ data: { id: string } | null; error: { message: string } | null }> {
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await client
    .from(PIPELINE_ARTIFACTS_TABLE)
    .select("id")
    .eq("id", artifactId)
    .maybeSingle();

  return {
    data: data as { id: string } | null,
    error: error ? { message: error.message } : null,
  };
}
