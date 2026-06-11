import { ApiError, handleApiError, ok, optionalStringField, readJsonObject, routeParam } from "@/lib/api/http";
import { getAuditRequestContext, writeAuditLog } from "@/lib/audit/log";
import { requireInternalSession } from "@/lib/auth/session";
import { validateUpdateUserInput } from "@/lib/auth/user-provisioning";
import { isLawyerRole, type UserRole } from "@/lib/domain/core";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const adminRoles: UserRole[] = ["system_admin", "firm_admin"];

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireInternalSession(adminRoles);
    const userId = await routeParam(context, "id");
    const body = await readJsonObject(request);
    const admin = createSupabaseAdminClient();
    const { data: member, error: memberError } = await admin
      .from("organization_members")
      .select("id, user_id, role_code, rank_id, status, profiles:user_id!inner(id, username, display_name, status)")
      .eq("organization_id", session.organizationId)
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    if (memberError) {
      throw memberError;
    }

    if (!member) {
      throw new ApiError(404, "NOT_FOUND", "用户不存在或不属于当前组织");
    }

    const nextRole = (optionalStringField(body, "roleCode") ?? member.role_code) as UserRole;
    const nextStatus = (optionalStringField(body, "status") ?? member.status) as "active" | "disabled";
    const nextRankId = optionalStringField(body, "rankId") ?? member.rank_id ?? undefined;
    const input = validateUpdateUserInput({
      roleCode: nextRole,
      rankId: isLawyerRole(nextRole) ? nextRankId : undefined,
      status: nextStatus,
    });

    if (userId === session.userId && (input.status !== "active" || input.roleCode !== member.role_code)) {
      throw new ApiError(409, "CONFLICT", "不能停用或变更当前登录账号的角色");
    }

    if (input.rankId) {
      const { data: rank, error: rankError } = await admin
        .from("ranks")
        .select("id")
        .eq("id", input.rankId)
        .eq("organization_id", session.organizationId)
        .eq("is_active", true)
        .maybeSingle();

      if (rankError) {
        throw rankError;
      }

      if (!rank) {
        throw new ApiError(400, "BAD_REQUEST", "职级不存在或已停用");
      }
    }

    const { data: updatedMember, error: updateMemberError } = await admin
      .from("organization_members")
      .update({
        rank_id: input.rankId ?? null,
        role_code: input.roleCode,
        status: input.status,
      })
      .eq("id", member.id)
      .select("id, user_id, role_code, rank_id, status")
      .single();

    if (updateMemberError) {
      throw updateMemberError;
    }

    const { data: updatedProfile, error: updateProfileError } = await admin
      .from("profiles")
      .update({ status: input.status })
      .eq("id", userId)
      .select("id, username, display_name, status, must_change_password")
      .single();

    if (updateProfileError) {
      throw updateProfileError;
    }

    const action = userStatusAction(member.status, input.status);

    await writeAuditLog(admin, {
      organizationId: session.organizationId,
      actorUserId: session.userId,
      action,
      entityType: "profiles",
      entityId: userId,
      metadata: {
        nextRankId: input.rankId,
        nextRoleCode: input.roleCode,
        nextStatus: input.status,
        previousRankId: member.rank_id,
        previousRoleCode: member.role_code,
        previousStatus: member.status,
        username: updatedProfile.username,
      },
      ...getAuditRequestContext(request),
    });

    return ok({
      user: {
        ...updatedMember,
        profiles: updatedProfile,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

function userStatusAction(previousStatus: string, nextStatus: string): string {
  if (previousStatus !== "disabled" && nextStatus === "disabled") {
    return "users.disable";
  }

  if (previousStatus === "disabled" && nextStatus === "active") {
    return "users.enable";
  }

  return "users.update";
}
