import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { SupabaseEnvConfig } from "@lexos/shared/config";
import {
  mapSystemSettingRow,
  type SystemSettingItem,
  type SystemSettingRowDb,
} from "./system-settings.types.js";

const SYSTEM_SETTING_SELECT = "key, value, updated_by, updated_at";

/**
 * 系统配置仓储（admin JWT + RLS `system_settings_admin`；`database.md` §3.12）。
 */
export class SystemSettingsRepository {
  private readonly supabaseUrl: string;
  private readonly supabaseAnonKey: string;

  constructor(supabaseEnv: SupabaseEnvConfig) {
    this.supabaseUrl = supabaseEnv.supabaseUrl;
    this.supabaseAnonKey = supabaseEnv.supabaseAnonKey;
  }

  /** 列出全部键值（按 `key` 升序）。 */
  async list(accessToken: string): Promise<readonly SystemSettingItem[]> {
    const { data, error } = await this.userClient(accessToken)
      .from("system_settings")
      .select(SYSTEM_SETTING_SELECT)
      .order("key", { ascending: true });

    if (error) {
      throw new Error(`system_settings.list failed: ${error.message}`);
    }

    return ((data ?? []) as SystemSettingRowDb[]).map(mapSystemSettingRow);
  }

  /** 按 key 查询；不存在返回 `null`。 */
  async get(accessToken: string, key: string): Promise<SystemSettingItem | null> {
    const { data, error } = await this.userClient(accessToken)
      .from("system_settings")
      .select(SYSTEM_SETTING_SELECT)
      .eq("key", key)
      .maybeSingle();

    if (error) {
      throw new Error(`system_settings.get failed: ${error.message}`);
    }
    return data ? mapSystemSettingRow(data as SystemSettingRowDb) : null;
  }

  /**
   * 插入或更新配置项。
   */
  async upsert(
    accessToken: string,
    key: string,
    value: Readonly<Record<string, unknown>>,
    updatedBy: string,
  ): Promise<SystemSettingItem> {
    const { data, error } = await this.userClient(accessToken)
      .from("system_settings")
      .upsert(
        {
          key,
          value,
          updated_by: updatedBy,
        },
        { onConflict: "key" },
      )
      .select(SYSTEM_SETTING_SELECT)
      .single();

    if (error) {
      throw new Error(`system_settings.upsert failed: ${error.message}`);
    }
    return mapSystemSettingRow(data as SystemSettingRowDb);
  }

  private userClient(accessToken: string): SupabaseClient {
    return createClient(this.supabaseUrl, this.supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });
  }
}
