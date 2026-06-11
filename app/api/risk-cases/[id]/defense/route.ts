import { ApiError, handleApiError, ok, readJsonObject, routeParam } from "@/lib/api/http";
import { getAuditRequestContext, writeAuditLog } from "@/lib/audit/log";
import { requireInternalSession } from "@/lib/auth/session";
import type { RiskCaseStatus } from "@/lib/risk/cases";
import { buildRiskCaseDefenseStatus, normalizeRiskCaseDefenseInput } from "@/lib/risk/defense";
import { enrichRiskCases, type RiskCaseRow } from "@/lib/risk/records";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const riskCaseSelect =
  "id, organization_id, task_id, customer_id, reported_by_user_id, owner_user_id, source, severity, status, title, description, resolution_note, defense_statement, defended_at, committee_decision, committee_decision_note, committee_deduction_basis_points, committee_decided_by, committee_decided_at, resolved_at, created_at, updated_at";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireInternalSession(["handling_lawyer"]);
    const riskCaseId = await routeParam(context, "id");
    const body = await readJsonObject(request);
    let input;

    try {
      input = normalizeRiskCaseDefenseInput(body);
    } catch (error) {
      throw new ApiError(400, "BAD_REQUEST", error instanceof Error ? error.message : "答辩参数不正确");
    }

    const admin = createSupabaseAdminClient();
    const { data: existing, error: existingError } = await admin
      .from("risk_cases")
      .select(riskCaseSelect)
      .eq("id", riskCaseId)
      .eq("organization_id", session.organizationId)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    if (!existing) {
      throw new ApiError(404, "NOT_FOUND", "风控工单不存在");
    }

    const riskCase = existing as RiskCaseRow;

    if (!riskCase.task_id) {
      throw new ApiError(400, "BAD_REQUEST", "只有关联任务的风控工单才能提交答辩");
    }

    const { data: task, error: taskError } = await admin
      .from("tasks")
      .select("id, assigned_lawyer_id")
      .eq("id", riskCase.task_id)
      .eq("organization_id", session.organizationId)
      .maybeSingle();

    if (taskError) {
      throw taskError;
    }

    if (!task) {
      throw new ApiError(404, "NOT_FOUND", "关联任务不存在");
    }

    if (task.assigned_lawyer_id !== session.userId) {
      throw new ApiError(403, "FORBIDDEN", "办案律师只能答辩自己承办任务的风控工单");
    }

    const defenseStatus = buildRiskCaseDefenseStatus({
      createdAt: riskCase.created_at,
      defendedAt: riskCase.defended_at,
      status: riskCase.status as RiskCaseStatus,
    });

    if (defenseStatus.submitted) {
      throw new ApiError(409, "CONFLICT", "该风控工单已提交答辩");
    }

    if (riskCase.status === "resolved") {
      throw new ApiError(409, "CONFLICT", "已办结风控工单不能提交答辩");
    }

    if (defenseStatus.overdue || !defenseStatus.deadlineAt) {
      throw new ApiError(409, "CONFLICT", "答辩期限已超过 48 小时");
    }

    const defendedAt = new Date().toISOString();
    const { data: updated, error: updateError } = await admin
      .from("risk_cases")
      .update({
        defended_at: defendedAt,
        defense_statement: input.defenseStatement,
        updated_at: defendedAt,
      })
      .eq("id", riskCaseId)
      .eq("organization_id", session.organizationId)
      .select(riskCaseSelect)
      .single();

    if (updateError) {
      throw updateError;
    }

    await writeAuditLog(admin, {
      organizationId: session.organizationId,
      actorUserId: session.userId,
      action: "risk_cases.submit_defense",
      entityType: "risk_cases",
      entityId: riskCaseId,
      metadata: {
        deadlineAt: defenseStatus.deadlineAt.toISOString(),
        taskId: riskCase.task_id,
      },
      ...getAuditRequestContext(request),
    });

    const [enrichedRiskCase] = await enrichRiskCases(admin, [updated as RiskCaseRow]);

    return ok({ riskCase: enrichedRiskCase });
  } catch (error) {
    return handleApiError(error);
  }
}
