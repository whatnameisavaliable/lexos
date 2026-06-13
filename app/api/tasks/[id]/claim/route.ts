import { ApiError, handleApiError, ok, routeParam } from "@/lib/api/http";
import { getAuditRequestContext, writeAuditLog } from "@/lib/audit/log";
import { requireInternalSession } from "@/lib/auth/session";
import { lawyerRoleCodes, lawyerRoles, transitionTaskStatus, type UserRole } from "@/lib/domain/core";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  CLAIM_BLOCKING_RISK_SEVERITIES,
  CLAIM_BLOCKING_RISK_STATUSES,
  buildClaimRiskRestriction,
  canClaimTaskWithRestriction,
} from "@/lib/tasks/claim-restrictions";

const lawyerAccessRoles: UserRole[] = [...lawyerRoles];
const lawyerAccessRoleCodes = [...lawyerRoleCodes];

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireInternalSession(lawyerAccessRoles);
    const taskId = await routeParam(context, "id");
    const admin = createSupabaseAdminClient();

    const { data: task, error: taskError } = await admin
      .from("tasks")
      .select("id, organization_id, status, min_rank_id")
      .eq("id", taskId)
      .eq("organization_id", session.organizationId)
      .maybeSingle();

    if (taskError) {
      throw taskError;
    }

    if (!task) {
      throw new ApiError(404, "NOT_FOUND", "任务不存在");
    }

    const { data: member, error: memberError } = await admin
      .from("organization_members")
      .select("rank_id")
      .eq("organization_id", session.organizationId)
      .eq("user_id", session.userId)
      .in("role_code", lawyerAccessRoleCodes)
      .eq("status", "active")
      .maybeSingle();

    if (memberError) {
      throw memberError;
    }

    if (!member?.rank_id) {
      throw new ApiError(403, "FORBIDDEN", "律师尚未绑定职级");
    }

    const minRankOrder = task.min_rank_id
      ? await getRankOrder(admin, session.organizationId, task.min_rank_id)
      : 0;
    const lawyerRankOrder = await getRankOrder(admin, session.organizationId, member.rank_id);

    const basePermission = canClaimTaskWithRestriction({
      taskStatus: task.status,
      userRole: session.roleCode,
      lawyerRankOrder: lawyerRankOrder ?? 0,
      minRankOrder,
    });

    if (!basePermission.allowed) {
      throw new ApiError(409, "CONFLICT", basePermission.reason ?? "当前任务不可承接或职级不满足要求");
    }

    const riskRestriction = await getClaimRiskRestriction(admin, session.organizationId, session.userId);
    const claimPermission = canClaimTaskWithRestriction({
      taskStatus: task.status,
      userRole: session.roleCode,
      lawyerRankOrder: lawyerRankOrder ?? 0,
      minRankOrder,
      restriction: riskRestriction,
    });

    if (!claimPermission.allowed) {
      throw new ApiError(409, "CONFLICT", claimPermission.reason ?? "存在未办结严重风控工单，暂不能抢新任务");
    }

    const { data: updated, error: updateError } = await admin
      .from("tasks")
      .update({
        status: transitionTaskStatus("open", "claim"),
        assigned_lawyer_id: session.userId,
      })
      .eq("id", taskId)
      .eq("status", "open")
      .select("id, status, assigned_lawyer_id")
      .single();

    if (updateError) {
      throw updateError;
    }

    const { error: claimError } = await admin.from("task_claims").insert({
      organization_id: session.organizationId,
      task_id: taskId,
      lawyer_id: session.userId,
      status: "accepted",
    });

    if (claimError) {
      throw claimError;
    }

    await writeAuditLog(admin, {
      organizationId: session.organizationId,
      actorUserId: session.userId,
      action: "tasks.claim",
      entityType: "tasks",
      entityId: taskId,
      metadata: { claimRiskCaseCount: riskRestriction.blockingCaseCount, rankId: member.rank_id },
      ...getAuditRequestContext(_request),
    });

    return ok({ task: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

async function getRankOrder(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  organizationId: string,
  rankId: string,
): Promise<number> {
  const { data, error } = await admin
    .from("ranks")
    .select("sort_order")
    .eq("organization_id", organizationId)
    .eq("id", rankId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.sort_order ?? 0;
}

async function getClaimRiskRestriction(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  organizationId: string,
  lawyerId: string,
) {
  const { data: assignedTasks, error: taskError } = await admin
    .from("tasks")
    .select("id, title")
    .eq("organization_id", organizationId)
    .eq("assigned_lawyer_id", lawyerId)
    .limit(500);

  if (taskError) {
    throw taskError;
  }

  const taskTitleById = new Map((assignedTasks ?? []).map((task) => [task.id, task.title]));
  const taskIds = Array.from(taskTitleById.keys());

  if (!taskIds.length) {
    return buildClaimRiskRestriction([]);
  }

  const { data: riskCases, error: riskCaseError } = await admin
    .from("risk_cases")
    .select("id, task_id, title, severity, status")
    .eq("organization_id", organizationId)
    .in("task_id", taskIds)
    .in("severity", CLAIM_BLOCKING_RISK_SEVERITIES)
    .in("status", CLAIM_BLOCKING_RISK_STATUSES)
    .limit(100);

  if (riskCaseError) {
    if (isMissingRiskCasesTableError(riskCaseError)) {
      return buildClaimRiskRestriction([]);
    }

    throw riskCaseError;
  }

  return buildClaimRiskRestriction(
    (riskCases ?? []).map((riskCase) => ({
      id: riskCase.id,
      severity: riskCase.severity,
      status: riskCase.status,
      taskId: riskCase.task_id ?? undefined,
      taskTitle: riskCase.task_id ? taskTitleById.get(riskCase.task_id) : undefined,
      title: riskCase.title,
    })),
  );
}

function isMissingRiskCasesTableError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const code = "code" in error && typeof error.code === "string" ? error.code : "";
  const message = "message" in error && typeof error.message === "string" ? error.message : "";

  return (
    code === "42P01" ||
    code === "PGRST205" ||
    (message.includes("risk_cases") && (message.includes("does not exist") || message.includes("schema cache")))
  );
}
