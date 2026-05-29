import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { AdminUserListQuery } from "@lexos/shared";
import type { SupabaseEnvConfig } from "@lexos/shared/config";
import type { ProfileStatus } from "./profile.types.js";
import {
  ADMIN_USER_DETAIL_SELECT,
  ADMIN_USER_LIST_SELECT,
  decodeListCursor,
  encodeListCursor,
  mapAdminProfileRow,
  mapAdminUserListItem,
  type AdminProfileFieldsPatch,
  type AdminProfileRecord,
  type AdminUserListResult,
  type InsertProfileAfterAuthInput,
  type AdminProfileRowDb,
} from "./admin-user.types.js";

/**
 * 管理员跨用户 `profiles` 访问（仅 `service_role`；`architecture.md` §5.4）。
 */
export class AdminUserRepository {
  /**
   * @param serviceClient - Supabase `service_role` 客户端（禁止暴露给 HTTP 响应）
   */
  constructor(private readonly serviceClient: SupabaseClient) {}

  /**
   * 从环境配置构造仓库（HTTP 默认链路外单独使用 service_role）。
   */
  static fromSupabaseEnv(supabaseEnv: SupabaseEnvConfig): AdminUserRepository {
    const client = createClient(
      supabaseEnv.supabaseUrl,
      supabaseEnv.supabaseServiceRoleKey,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    return new AdminUserRepository(client);
  }

  /**
   * 分页列出用户（`created_at DESC`；默认 limit 50）。
   */
  async listUsers(query: AdminUserListQuery): Promise<AdminUserListResult> {
    const fetchLimit = query.limit + 1;

    let builder = this.serviceClient
      .from("profiles")
      .select(ADMIN_USER_LIST_SELECT, {
        count: query.offset !== undefined ? "exact" : undefined,
      })
      .order("created_at", { ascending: false })
      .order("id", { ascending: false });

    if (query.role) {
      builder = builder.eq("role", query.role);
    }
    if (query.status) {
      builder = builder.eq("status", query.status);
    }
    if (query.q) {
      const pattern = `%${escapeIlikePattern(query.q)}%`;
      builder = builder.or(
        `username.ilike.${pattern},display_name.ilike.${pattern}`,
      );
    }
    if (query.cursor) {
      const { createdAt, id } = decodeListCursor(query.cursor);
      builder = builder.or(
        `created_at.lt.${createdAt},and(created_at.eq.${createdAt},id.lt.${id})`,
      );
    }
    if (query.offset !== undefined) {
      builder = builder.range(query.offset, query.offset + fetchLimit - 1);
    } else {
      builder = builder.limit(fetchLimit);
    }

    const { data, error, count } = await builder;
    if (error) {
      throw new Error(`profiles.listUsers failed: ${error.message}`);
    }

    const rows = (data ?? []) as AdminProfileRowDb[];
    const hasMore = query.offset === undefined && rows.length > query.limit;
    const pageRows = hasMore ? rows.slice(0, query.limit) : rows;
    const items = pageRows.map(mapAdminUserListItem);

    let nextCursor: string | undefined;
    if (hasMore && pageRows.length > 0) {
      const last = pageRows[pageRows.length - 1]!;
      nextCursor = encodeListCursor(last.created_at, last.id);
    }

    return {
      items,
      nextCursor,
      total: query.offset !== undefined ? count ?? undefined : undefined,
    };
  }

  /**
   * 按 ID 查询完整资料（编辑表单）。
   */
  async findUserById(id: string): Promise<AdminProfileRecord | null> {
    const { data, error } = await this.serviceClient
      .from("profiles")
      .select(ADMIN_USER_DETAIL_SELECT)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(`profiles.findUserById failed: ${error.message}`);
    }
    return data ? mapAdminProfileRow(data as AdminProfileRowDb) : null;
  }

  /**
   * 按用户名查重（创建前预检）。
   */
  async findUserByUsername(username: string): Promise<AdminProfileRecord | null> {
    const { data, error } = await this.serviceClient
      .from("profiles")
      .select(ADMIN_USER_DETAIL_SELECT)
      .eq("username", username)
      .maybeSingle();

    if (error) {
      throw new Error(`profiles.findUserByUsername failed: ${error.message}`);
    }
    return data ? mapAdminProfileRow(data as AdminProfileRowDb) : null;
  }

  /**
   * Auth 用户创建后写入 `profiles`（无 `handle_new_user` 时由 Service 调用）。
   */
  async insertProfileAfterAuth(
    input: InsertProfileAfterAuthInput,
  ): Promise<AdminProfileRecord> {
    const { data, error } = await this.serviceClient
      .from("profiles")
      .insert({
        id: input.id,
        username: input.username,
        display_name: input.displayName,
        role: input.role,
        contact: input.contact ?? null,
        status: "enabled",
        requires_password_change: true,
        mfa_enabled: false,
      })
      .select(ADMIN_USER_DETAIL_SELECT)
      .single();

    if (error) {
      throw new Error(`profiles.insert failed: ${error.message}`);
    }
    return mapAdminProfileRow(data as AdminProfileRowDb);
  }

  /**
   * 更新 `display_name` / `role` / `contact`（`service_role` + `profiles_write_admin`）。
   */
  async updateProfileFields(
    id: string,
    patch: AdminProfileFieldsPatch,
  ): Promise<AdminProfileRecord> {
    const { data, error } = await this.serviceClient.rpc("admin_update_profile", {
      p_user_id: id,
      p_display_name: patch.displayName ?? null,
      p_role: patch.role ?? null,
      p_contact: patch.contact === undefined ? null : patch.contact,
      p_touch_display_name: patch.displayName !== undefined,
      p_touch_role: patch.role !== undefined,
      p_touch_contact: patch.contact !== undefined,
    });

    if (error) {
      throw new Error(`admin_update_profile failed: ${error.message}`);
    }
    return mapAdminProfileRow(data as AdminProfileRowDb);
  }

  /**
   * 设置账户状态（`admin_set_user_status` SECURITY DEFINER；禁用流程由 Service 配合 `signOut(global)`）。
   */
  async setUserStatus(id: string, status: ProfileStatus): Promise<AdminProfileRecord> {
    const { data, error } = await this.serviceClient.rpc("admin_set_user_status", {
      p_user_id: id,
      p_status: status,
    });

    if (error) {
      throw new Error(`admin_set_user_status failed: ${error.message}`);
    }
    return mapAdminProfileRow(data as AdminProfileRowDb);
  }

  /**
   * 置 `requires_password_change`（`admin_mark_password_reset_required` RPC）。
   */
  async setRequiresPasswordChange(id: string, value: boolean): Promise<void> {
    const { error } = await this.serviceClient.rpc(
      "admin_mark_password_reset_required",
      { p_user_id: id, p_required: value },
    );

    if (error) {
      throw new Error(
        `admin_mark_password_reset_required failed: ${error.message}`,
      );
    }
  }

  /**
   * 统计启用中的 `admin` 数量（末位 admin 防护）。
   */
  /**
   * 为新用户种子云盘根目录（`database.md` §7.2.1 `__root__` 文件夹）。
   */
  async seedDriveRootFolder(userId: string): Promise<void> {
    const { error } = await this.serviceClient.from("drive_nodes").insert({
      created_by: userId,
      parent_id: null,
      node_type: "folder",
      name: "__root__",
    });

    if (error) {
      throw new Error(`drive_nodes.seedDriveRoot failed: ${error.message}`);
    }
  }

  /**
   * 单事务标记强制改密并写 `auth.password_reset` 审计（`architecture.md` §5.1.4.1）。
   */
  async applyPasswordResetAudit(
    targetUserId: string,
    actorId: string,
    meta: { readonly ip?: string | null; readonly userAgent?: string | null },
  ): Promise<void> {
    const { error } = await this.serviceClient.rpc("admin_apply_password_reset", {
      p_user_id: targetUserId,
      p_actor_id: actorId,
      p_ip: meta.ip ?? null,
      p_user_agent: meta.userAgent ?? null,
    });

    if (error) {
      throw new Error(`admin_apply_password_reset failed: ${error.message}`);
    }
  }

  /**
   * 删除 `profiles` 行（创建失败回滚；须先于 Auth 用户删除）。
   */
  async deleteProfile(userId: string): Promise<void> {
    const { error } = await this.serviceClient
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (error) {
      throw new Error(`profiles.delete failed: ${error.message}`);
    }
  }

  async countEnabledAdmins(): Promise<number> {
    const { count, error } = await this.serviceClient
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin")
      .eq("status", "enabled");

    if (error) {
      throw new Error(`profiles.countEnabledAdmins failed: ${error.message}`);
    }
    return count ?? 0;
  }
}

function escapeIlikePattern(value: string): string {
  return value.replace(/[%_\\]/g, "\\$&");
}
