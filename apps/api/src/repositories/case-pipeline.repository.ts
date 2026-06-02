import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { CasePipelineStatus } from "@lexos/shared";
import type { SupabaseEnvConfig } from "@lexos/shared/config";

/** `case_pipelines` 行（API 层）。 */
export interface CasePipelineRecord {
  readonly id: string;
  readonly lawyerId: string;
  readonly templateVersionId: string;
  readonly status: CasePipelineStatus;
  readonly currentStepCode: string | null;
  readonly createdAt: string;
}

interface CasePipelineRowDb {
  readonly id: string;
  readonly lawyer_id: string;
  readonly template_version_id: string;
  readonly status: CasePipelineStatus;
  readonly current_step_code: string | null;
  readonly created_at: string;
}

const CASE_PIPELINE_SELECT =
  "id, lawyer_id, template_version_id, status, current_step_code, created_at";

/**
 * 案件流水线仓储（律师 JWT + RLS；`database.md` §3.16.4）。
 */
export class CasePipelineRepository {
  private readonly supabaseUrl: string;
  private readonly supabaseAnonKey: string;

  constructor(supabaseEnv: SupabaseEnvConfig) {
    this.supabaseUrl = supabaseEnv.supabaseUrl;
    this.supabaseAnonKey = supabaseEnv.supabaseAnonKey;
  }

  /**
   * 创建流水线实例（绑定已发布模板版本快照）。
   */
  async createPipeline(
    accessToken: string,
    templateVersionId: string,
    lawyerId: string,
    entryStepCode: string,
  ): Promise<CasePipelineRecord> {
    const client = this.userClient(accessToken);
    const { data, error } = await client
      .from("case_pipelines")
      .insert({
        lawyer_id: lawyerId,
        template_version_id: templateVersionId,
        status: "in_progress",
        current_step_code: entryStepCode,
      })
      .select(CASE_PIPELINE_SELECT)
      .single();

    if (error) {
      throw new Error(`case_pipelines.createPipeline failed: ${error.message}`);
    }
    return mapCasePipelineRow(data as CasePipelineRowDb);
  }

  /**
   * 按 ID 查询（RLS 限制 `lawyer_id = auth.uid()`）。
   */
  async findPipelineForLawyer(
    accessToken: string,
    pipelineId: string,
  ): Promise<CasePipelineRecord | null> {
    const client = this.userClient(accessToken);
    const { data, error } = await client
      .from("case_pipelines")
      .select(CASE_PIPELINE_SELECT)
      .eq("id", pipelineId)
      .maybeSingle();

    if (error) {
      throw new Error(
        `case_pipelines.findPipelineForLawyer failed: ${error.message}`,
      );
    }
    return data ? mapCasePipelineRow(data as CasePipelineRowDb) : null;
  }

  /**
   * 更新流水线状态（仅本人流水线，RLS 生效）。
   */
  async updatePipelineStatus(
    accessToken: string,
    pipelineId: string,
    status: CasePipelineStatus,
  ): Promise<CasePipelineRecord | null> {
    const client = this.userClient(accessToken);
    const { data, error } = await client
      .from("case_pipelines")
      .update({ status })
      .eq("id", pipelineId)
      .select(CASE_PIPELINE_SELECT)
      .maybeSingle();

    if (error) {
      throw new Error(
        `case_pipelines.updatePipelineStatus failed: ${error.message}`,
      );
    }
    return data ? mapCasePipelineRow(data as CasePipelineRowDb) : null;
  }

  /**
   * 更新当前步骤游标。
   */
  async updateCurrentStepCode(
    accessToken: string,
    pipelineId: string,
    currentStepCode: string | null,
  ): Promise<CasePipelineRecord | null> {
    const client = this.userClient(accessToken);
    const { data, error } = await client
      .from("case_pipelines")
      .update({ current_step_code: currentStepCode })
      .eq("id", pipelineId)
      .select(CASE_PIPELINE_SELECT)
      .maybeSingle();

    if (error) {
      throw new Error(
        `case_pipelines.updateCurrentStepCode failed: ${error.message}`,
      );
    }
    return data ? mapCasePipelineRow(data as CasePipelineRowDb) : null;
  }

  private userClient(accessToken: string): SupabaseClient {
    return createClient(this.supabaseUrl, this.supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });
  }
}

function mapCasePipelineRow(row: CasePipelineRowDb): CasePipelineRecord {
  return {
    id: row.id,
    lawyerId: row.lawyer_id,
    templateVersionId: row.template_version_id,
    status: row.status,
    currentStepCode: row.current_step_code,
    createdAt: row.created_at,
  };
}
