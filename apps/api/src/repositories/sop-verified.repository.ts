import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { SupabaseEnvConfig } from "@lexos/shared/config";

/**
 * SOP [Verified] 判定仓储（`service_role`；`database.md` §3.16.7）。
 */
export class SopVerifiedRepository {
  constructor(private readonly serviceClient: SupabaseClient) {}

  static fromSupabaseEnv(supabaseEnv: SupabaseEnvConfig): SopVerifiedRepository {
    const client = createClient(
      supabaseEnv.supabaseUrl,
      supabaseEnv.supabaseServiceRoleKey,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    return new SopVerifiedRepository(client);
  }

  /**
   * 是否存在本步骤成功的 AI 调用日志（`metadata.pipeline_id` + `step_code`）。
   */
  async hasAutoVerification(
    pipelineId: string,
    stepCode: string,
  ): Promise<boolean> {
    const { data, error } = await this.serviceClient
      .from("ai_invocation_logs")
      .select("id")
      .eq("outcome", "success")
      .contains("metadata", { pipeline_id: pipelineId, step_code: stepCode })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(
        `ai_invocation_logs.hasAutoVerification failed: ${error.message}`,
      );
    }
    return Boolean(data);
  }

  /**
   * 是否存在人工校验审计（`sop.artifact.verify` + `metadata.artifact_id`）。
   */
  async hasManualVerification(artifactId: string): Promise<boolean> {
    const { data, error } = await this.serviceClient
      .from("audit_logs")
      .select("id")
      .eq("action", "sop.artifact.verify")
      .contains("metadata", { artifact_id: artifactId })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(
        `audit_logs.hasManualVerification failed: ${error.message}`,
      );
    }
    return Boolean(data);
  }
}
