import { ApiError } from "@/lib/api/http";
import { getSupabaseRuntimeEnv } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/domain/core";

export type InternalSession = {
  userId: string;
  username: string;
  displayName: string;
  organizationId: string;
  roleCode: UserRole;
  rankId?: string;
  rankCode?: string;
  mustChangePassword: boolean;
};

export async function loadInternalSessionForUser(userId: string, allowedRoles?: UserRole[]): Promise<InternalSession> {
  const env = getSupabaseRuntimeEnv();

  if (!env) {
    throw new ApiError(503, "CONFIG_MISSING", "Supabase 环境变量未配置");
  }

  const admin = createSupabaseAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id, username, display_name, status, must_change_password")
    .eq("id", userId)
    .maybeSingle();

  if (profileError || !profile || profile.status !== "active") {
    throw new ApiError(401, "UNAUTHORIZED", "账号不存在或已停用");
  }

  const { data: memberships, error: membershipError } = await admin
    .from("organization_members")
    .select("organization_id, role_code, rank_id, status, ranks:rank_id(code)")
    .eq("user_id", userId)
    .eq("organization_id", env.defaultOrganizationId)
    .eq("status", "active");

  if (membershipError || !memberships?.length) {
    throw new ApiError(403, "FORBIDDEN", "当前用户没有组织权限");
  }

  const membership =
    allowedRoles && allowedRoles.length
      ? memberships.find((item) => allowedRoles.includes(item.role_code as UserRole))
      : memberships[0];

  if (!membership) {
    throw new ApiError(403, "FORBIDDEN", "无权执行该操作");
  }

  const rank = Array.isArray(membership.ranks) ? membership.ranks[0] : membership.ranks;

  return {
    userId: profile.id,
    username: profile.username,
    displayName: profile.display_name,
    organizationId: membership.organization_id,
    roleCode: membership.role_code as UserRole,
    rankId: membership.rank_id ?? undefined,
    rankCode: rank?.code,
    mustChangePassword: Boolean(profile.must_change_password),
  };
}

export async function requireInternalSession(allowedRoles?: UserRole[]): Promise<InternalSession> {
  const env = getSupabaseRuntimeEnv();

  if (!env) {
    throw new ApiError(503, "CONFIG_MISSING", "Supabase 环境变量未配置");
  }

  const serverClient = await createSupabaseServerClient();

  if (!serverClient) {
    throw new ApiError(503, "CONFIG_MISSING", "Supabase 服务端客户端不可用");
  }

  const {
    data: { user },
    error: userError,
  } = await serverClient.auth.getUser();

  if (userError || !user) {
    throw new ApiError(401, "UNAUTHORIZED", "请先登录");
  }

  return loadInternalSessionForUser(user.id, allowedRoles);
}
