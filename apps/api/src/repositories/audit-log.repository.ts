import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { SupabaseEnvConfig } from "@lexos/shared/config";

/** `public.audit_action` 子集（登录/登出/改密，M1 使用）。 */
export type AuditAction =
  | "auth.login_success"
  | "auth.login_failure"
  | "auth.logout"
  | "auth.password_change"
  | "auth.password_reset"
  | "user.create"
  | "user.update"
  | "user.disable"
  | "user.enable"
  | "ai.model.upsert"
  | "ai.mapping.upsert"
  | "ai.prompt.publish";

/** `append_audit_log` 入参。 */
export interface AppendAuditLogInput {
  readonly actorId: string | null;
  readonly action: AuditAction;
  readonly targetType?: string;
  readonly targetId?: string | null;
  readonly ip?: string | null;
  readonly userAgent?: string | null;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

/**
 * 审计日志追加（仅 `service_role` → `append_audit_log()` RPC）。
 */
export class AuditLogRepository {
  private readonly client: SupabaseClient;

  constructor(supabaseEnv: SupabaseEnvConfig) {
    this.client = createClient(
      supabaseEnv.supabaseUrl,
      supabaseEnv.supabaseServiceRoleKey,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
  }

  /**
   * 追加一条审计记录；返回新行 `id`。
   */
  async append(input: AppendAuditLogInput): Promise<string> {
    const { data, error } = await this.client.rpc("append_audit_log", {
      p_actor_id: input.actorId,
      p_action: input.action,
      p_target_type: input.targetType ?? null,
      p_target_id: input.targetId ?? null,
      p_ip: input.ip ?? null,
      p_user_agent: input.userAgent ?? null,
      p_metadata: input.metadata ?? {},
    });

    if (error) {
      throw new Error(`append_audit_log failed: ${error.message}`);
    }

    if (typeof data !== "string") {
      throw new Error("append_audit_log returned unexpected payload");
    }
    return data;
  }
}
