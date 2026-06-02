import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { SupabaseEnvConfig } from "@lexos/shared/config";

/**
 * 系统设置只读仓库（`service_role`；供内部 Guard 使用）。
 */
export class SystemSettingReadRepository {
  constructor(private readonly serviceClient: SupabaseClient) {}

  static fromSupabaseEnv(
    supabaseEnv: SupabaseEnvConfig,
  ): SystemSettingReadRepository {
    const client = createClient(
      supabaseEnv.supabaseUrl,
      supabaseEnv.supabaseServiceRoleKey,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    return new SystemSettingReadRepository(client);
  }

  /** 读取 JSONB 值；不存在返回 `null`。 */
  async getValue(key: string): Promise<unknown | null> {
    const { data, error } = await this.serviceClient
      .from("system_settings")
      .select("value")
      .eq("key", key)
      .maybeSingle();

    if (error) {
      throw new Error(`system_settings.getValue failed: ${error.message}`);
    }
    return data?.value ?? null;
  }
}
