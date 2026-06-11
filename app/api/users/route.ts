import { ApiError, handleApiError, ok, optionalStringField, readJsonObject, stringField } from "@/lib/api/http";
import { getAuditRequestContext, writeAuditLog } from "@/lib/audit/log";
import { requireInternalSession } from "@/lib/auth/session";
import { validateCreateUserInput } from "@/lib/auth/user-provisioning";
import { getSupabaseRuntimeEnv } from "@/lib/env";
import type { UserRole } from "@/lib/domain/core";
import {
  normalizedQueryParam,
  paginationMeta,
  parseListQuery,
  parseListSort,
  postgrestInFilter,
  postgrestLikePattern,
} from "@/lib/api/pagination";
import { loadSystemSettingNumber } from "@/lib/settings/runtime";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const userReadRoles: UserRole[] = ["system_admin", "firm_admin", "director"];
const userWriteRoles: UserRole[] = ["system_admin", "firm_admin"];
const userSortOptions = {
  createdAtAsc: { ascending: true, column: "created_at" },
  createdAtDesc: { ascending: false, column: "created_at" },
  roleAsc: { ascending: true, column: "role_code" },
  statusAsc: { ascending: true, column: "status" },
};

export async function GET(request: Request) {
  try {
    const session = await requireInternalSession(userReadRoles);
    const admin = createSupabaseAdminClient();
    const defaultPageSize = await loadSystemSettingNumber(admin, session.organizationId, "default_page_size");
    const listQuery = parseListQuery(request, { defaultPageSize });
    const sort = parseListSort(request, userSortOptions, "createdAtDesc");
    const role = normalizedQueryParam(request, "role");
    const status = normalizedQueryParam(request, "status");
    const searchPattern = postgrestLikePattern(listQuery.search);
    let matchedProfileIds: string[] = [];

    if (searchPattern) {
      const { data: profiles, error: profileSearchError } = await admin
        .from("profiles")
        .select("id")
        .or(
          [`username.ilike.${searchPattern}`, `display_name.ilike.${searchPattern}`, `phone.ilike.${searchPattern}`].join(
            ",",
          ),
        )
        .limit(200);

      if (profileSearchError) {
        throw profileSearchError;
      }

      matchedProfileIds = (profiles ?? []).map((profile) => profile.id);
    }

    let query = admin
      .from("organization_members")
      .select(
        "id, organization_id, role_code, rank_id, status, profiles:user_id!inner(id, username, display_name, phone, status, must_change_password), ranks:rank_id(code, name)",
        { count: "exact" },
      )
      .eq("organization_id", session.organizationId)
      .order(sort.column, { ascending: sort.ascending });

    if (role && role !== "all") {
      query = query.eq("role_code", role);
    }

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    if (searchPattern) {
      const filters = [`role_code.ilike.${searchPattern}`];
      const profileFilter = postgrestInFilter(matchedProfileIds);

      if (profileFilter) {
        filters.push(`user_id.in.${profileFilter}`);
      }

      query = query.or(filters.join(","));
    }

    const { data, error, count } = await query.range(listQuery.from, listQuery.to);

    if (error) {
      throw error;
    }

    return ok({ pagination: paginationMeta(listQuery, count), users: data ?? [] });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  let createdAuthUserId: string | undefined;

  try {
    const session = await requireInternalSession(userWriteRoles);
    const body = await readJsonObject(request);
    const env = getSupabaseRuntimeEnv();

    if (!env) {
      throw new ApiError(503, "CONFIG_MISSING", "Supabase 环境变量未配置");
    }

    const input = validateCreateUserInput({
      username: stringField(body, "username", "用户名"),
      displayName: stringField(body, "displayName", "姓名"),
      roleCode: stringField(body, "roleCode", "角色") as UserRole,
      rankId: optionalStringField(body, "rankId"),
      phone: optionalStringField(body, "phone"),
      authEmailDomain: env.authEmailDomain,
    });

    const admin = createSupabaseAdminClient();
    const { data: createdUser, error: createUserError } = await admin.auth.admin.createUser({
      email: input.authEmail,
      password: input.defaultPassword,
      email_confirm: true,
      user_metadata: {
        display_name: input.displayName,
        username: input.username,
      },
    });

    if (createUserError || !createdUser.user) {
      throw createUserError ?? new Error("创建 Supabase Auth 用户失败");
    }

    createdAuthUserId = createdUser.user.id;

    const { error: profileError } = await admin.from("profiles").insert({
      id: createdUser.user.id,
      username: input.username,
      display_name: input.displayName,
      phone: input.phone,
      auth_email: input.authEmail,
      must_change_password: input.mustChangePassword,
      status: "active",
    });

    if (profileError) {
      throw profileError;
    }

    const { error: memberError } = await admin.from("organization_members").insert({
      organization_id: session.organizationId,
      user_id: createdUser.user.id,
      role_code: input.roleCode,
      rank_id: input.rankId,
      status: "active",
    });

    if (memberError) {
      throw memberError;
    }

    await writeAuditLog(admin, {
      organizationId: session.organizationId,
      actorUserId: session.userId,
      action: "users.create",
      entityType: "profiles",
      entityId: createdUser.user.id,
      metadata: {
        username: input.username,
        displayName: input.displayName,
        roleCode: input.roleCode,
        rankId: input.rankId,
      },
      ...getAuditRequestContext(request),
    });

    return ok(
      {
        user: {
          id: createdUser.user.id,
          username: input.username,
          displayName: input.displayName,
          roleCode: input.roleCode,
          rankId: input.rankId,
          mustChangePassword: true,
          defaultPassword: input.defaultPassword,
        },
      },
      201,
    );
  } catch (error) {
    if (createdAuthUserId) {
      try {
        await createSupabaseAdminClient().auth.admin.deleteUser(createdAuthUserId);
      } catch {
        // Best-effort rollback. The API response should report the original error.
      }
    }

    return handleApiError(error);
  }
}
