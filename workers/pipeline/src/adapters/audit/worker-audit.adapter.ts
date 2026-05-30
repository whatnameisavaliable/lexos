import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { SupabaseEnvConfig } from "@lexos/shared/config";

/**
 * Worker 审计写入（`append_audit_log` RPC）。
 */
export class WorkerAuditAdapter {
  private readonly client: SupabaseClient;

  constructor(
    supabaseEnv: Pick<
      SupabaseEnvConfig,
      "supabaseUrl" | "supabaseServiceRoleKey"
    >,
  ) {
    this.client = createClient(
      supabaseEnv.supabaseUrl,
      supabaseEnv.supabaseServiceRoleKey,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
  }

  /** 写入任务完成审计。 */
  async appendTaskComplete(
    taskId: string,
    metadata: Readonly<Record<string, unknown>> = {},
  ): Promise<void> {
    const { error } = await this.client.rpc("append_audit_log", {
      p_actor_id: null,
      p_action: "task.complete",
      p_target_type: "transcription_task",
      p_target_id: taskId,
      p_ip: null,
      p_user_agent: null,
      p_metadata: metadata,
    });
    if (error) {
      throw new Error(`append_audit_log task.complete failed: ${error.message}`);
    }
  }

  /** 写入 Stalled 补偿审计。 */
  async appendStalledRecovery(
    taskId: string,
    metadata: Readonly<Record<string, unknown>>,
  ): Promise<void> {
    const { error } = await this.client.rpc("append_audit_log", {
      p_actor_id: null,
      p_action: "task.fail",
      p_target_type: "transcription_task",
      p_target_id: taskId,
      p_ip: null,
      p_user_agent: null,
      p_metadata: metadata,
    });
    if (error) {
      throw new Error(`append_audit_log stalled recovery failed: ${error.message}`);
    }
  }
}
