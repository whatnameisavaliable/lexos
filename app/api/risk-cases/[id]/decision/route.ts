import { ApiError, handleApiError, ok, readJsonObject, routeParam } from "@/lib/api/http";
import { getAuditRequestContext, writeAuditLog } from "@/lib/audit/log";
import { requireInternalSession } from "@/lib/auth/session";
import { type RiskCaseStatus } from "@/lib/risk/cases";
import {
  canSubmitCommitteeDecision,
  normalizeRiskCaseCommitteeDecisionInput,
} from "@/lib/risk/committee-decision";
import { buildRiskCaseDefenseStatus } from "@/lib/risk/defense";
import { enrichRiskCases, type RiskCaseRow } from "@/lib/risk/records";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const riskCaseSelect =
  "id, organization_id, task_id, customer_id, reported_by_user_id, owner_user_id, source, severity, status, title, description, resolution_note, defense_statement, defended_at, committee_decision, committee_decision_note, committee_deduction_basis_points, committee_decided_by, committee_decided_at, resolved_at, created_at, updated_at";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireInternalSession(["system_admin", "firm_admin", "director"]);
    const riskCaseId = await routeParam(context, "id");
    const body = await readJsonObject(request);
    let decisionInput;

    try {
      decisionInput = normalizeRiskCaseCommitteeDecisionInput(body);
    } catch (error) {
      throw new ApiError(400, "BAD_REQUEST", error instanceof Error ? error.message : "委员会裁决参数不正确");
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
    const defenseStatus = buildRiskCaseDefenseStatus({
      createdAt: riskCase.created_at,
      defendedAt: riskCase.defended_at,
      status: riskCase.status as RiskCaseStatus,
    });
    const permission = canSubmitCommitteeDecision({
      defenseOverdue: defenseStatus.overdue,
      defenseSubmitted: defenseStatus.submitted,
      existingDecision: riskCase.committee_decision,
      status: riskCase.status as RiskCaseStatus,
    });

    if (!permission.allowed) {
      throw new ApiError(409, "CONFLICT", permission.reason ?? "当前风控工单不能提交委员会裁决");
    }

    const decidedAt = new Date().toISOString();
    const { data: updated, error: updateError } = await admin
      .from("risk_cases")
      .update({
        committee_decided_at: decidedAt,
        committee_decided_by: session.userId,
        committee_decision: decisionInput.decision,
        committee_decision_note: decisionInput.note,
        committee_deduction_basis_points: decisionInput.deductionBasisPoints,
        owner_user_id: session.userId,
        resolution_note: decisionInput.nextStatus === "resolved" ? decisionInput.note : riskCase.resolution_note,
        resolved_at: decisionInput.nextStatus === "resolved" ? decidedAt : null,
        status: decisionInput.nextStatus,
        updated_at: decidedAt,
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
      action: "risk_cases.committee_decide",
      entityType: "risk_cases",
      entityId: riskCaseId,
      metadata: {
        decision: decisionInput.decision,
        deductionBasisPoints: decisionInput.deductionBasisPoints,
        nextStatus: decisionInput.nextStatus,
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
