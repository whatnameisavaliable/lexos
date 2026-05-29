import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { SupabaseEnvConfig } from "@lexos/shared/config";
import {
  mapProfileRow,
  type ProfileRecord,
  type ProfileRowDb,
} from "./profile.types.js";

const PROFILE_SELECT =
  "id, username, display_name, role, contact, status, requires_password_change, mfa_enabled";

/**
 * 用户 JWT 上下文下的 `profiles` 访问（RLS 生效）。
 */
export class ProfileRepository {
  private readonly supabaseUrl: string;
  private readonly supabaseAnonKey: string;

  constructor(supabaseEnv: SupabaseEnvConfig) {
    this.supabaseUrl = supabaseEnv.supabaseUrl;
    this.supabaseAnonKey = supabaseEnv.supabaseAnonKey;
  }

  /**
   * 按主键查询（须为当前 JWT 用户或 admin RLS 策略允许）。
   */
  async findById(
    accessToken: string,
    userId: string,
  ): Promise<ProfileRecord | null> {
    const client = this.userClient(accessToken);
    const { data, error } = await client
      .from("profiles")
      .select(PROFILE_SELECT)
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      throw new Error(`profiles.findById failed: ${error.message}`);
    }
    return data ? mapProfileRow(data as ProfileRowDb) : null;
  }

  /**
   * 按用户名查询（登录前由 Service 配合 Admin 路径使用；RLS 可能限制匿名）。
   */
  async findByUsername(
    accessToken: string,
    username: string,
  ): Promise<ProfileRecord | null> {
    const client = this.userClient(accessToken);
    const { data, error } = await client
      .from("profiles")
      .select(PROFILE_SELECT)
      .eq("username", username)
      .maybeSingle();

    if (error) {
      throw new Error(`profiles.findByUsername failed: ${error.message}`);
    }
    return data ? mapProfileRow(data as ProfileRowDb) : null;
  }

  /**
   * 更新本人 `display_name` / `contact`（触发器禁止改 role 等）。
   */
  async updateDisplayContact(
    accessToken: string,
    userId: string,
    patch: { displayName?: string; contact?: string | null },
  ): Promise<ProfileRecord> {
    const client = this.userClient(accessToken);
    const payload: Record<string, string | null> = {};
    if (patch.displayName !== undefined) {
      payload.display_name = patch.displayName;
    }
    if (patch.contact !== undefined) {
      payload.contact = patch.contact;
    }

    const { data, error } = await client
      .from("profiles")
      .update(payload)
      .eq("id", userId)
      .select(PROFILE_SELECT)
      .single();

    if (error) {
      throw new Error(`profiles.update failed: ${error.message}`);
    }
    return mapProfileRow(data as ProfileRowDb);
  }

  private userClient(accessToken: string): SupabaseClient {
    return createClient(this.supabaseUrl, this.supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });
  }
}
