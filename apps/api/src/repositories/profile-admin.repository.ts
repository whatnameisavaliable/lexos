import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { SupabaseEnvConfig } from "@lexos/shared/config";

/**
 * `profiles` 受保护字段与 SECURITY DEFINER RPC（`database.md` §7.4）。
 */
export class ProfileAdminRepository {
  private readonly serviceClient: SupabaseClient;
  private readonly supabaseUrl: string;
  private readonly supabaseAnonKey: string;

  constructor(supabaseEnv: SupabaseEnvConfig) {
    this.supabaseUrl = supabaseEnv.supabaseUrl;
    this.supabaseAnonKey = supabaseEnv.supabaseAnonKey;
    this.serviceClient = createClient(
      supabaseEnv.supabaseUrl,
      supabaseEnv.supabaseServiceRoleKey,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
  }

  /**
   * 用户会话下调用 `complete_password_change()`（`auth.uid()` 须为本人）。
   */
  async completePasswordChange(accessToken: string): Promise<void> {
    const { error } = await this.userClient(accessToken).rpc(
      "complete_password_change",
    );
    if (error) {
      throw new Error(`complete_password_change failed: ${error.message}`);
    }
  }

  /**
   * 调用 `set_profile_mfa_enabled`（用户本人或 admin）。
   */
  async setMfaEnabled(
    accessToken: string,
    userId: string,
    enabled: boolean,
  ): Promise<void> {
    const { error } = await this.userClient(accessToken).rpc(
      "set_profile_mfa_enabled",
      { p_user_id: userId, p_enabled: enabled },
    );
    if (error) {
      throw new Error(`set_profile_mfa_enabled failed: ${error.message}`);
    }
  }

  /**
   * 管理员将 `requires_password_change` 置为 true（M2 重置密码用）。
   */
  async setRequiresPasswordChange(
    userId: string,
    value: boolean,
  ): Promise<void> {
    const { error } = await this.serviceClient
      .from("profiles")
      .update({ requires_password_change: value })
      .eq("id", userId);

    if (error) {
      throw new Error(
        `profiles.requires_password_change update failed: ${error.message}`,
      );
    }
  }

  private userClient(accessToken: string): SupabaseClient {
    return createClient(this.supabaseUrl, this.supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });
  }
}
