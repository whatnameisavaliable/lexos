import { ApiError, handleApiError, ok, readJsonObject, routeParam } from "@/lib/api/http";
import { getAuditRequestContext, writeAuditLog } from "@/lib/audit/log";
import { requireInternalSession } from "@/lib/auth/session";
import type { UserRole } from "@/lib/domain/core";
import { normalizeRiskCaseStatusUpdate, type RiskCaseStatus } from "@/lib/risk/cases";
import { enrichRiskCases, type RiskCaseRow } from "@/lib/risk/records";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const riskUpdateRoles: UserRole[] = ["system_admin", "firm_admin", "director", "source_lawyer"];
const riskCaseSelect =
  "id, organization_id, task_id, customer_id, reported_by_user_id, owner_user_id, source, severity, status, title, description, resolution_note, defense_statement, defended_at, committee_decision, committee_decision_note, committee_deduction_basis_points, committee_decided_by, committee_decided_at, resolved_at, created_at, updated_at";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireInternalSession(riskUpdateRoles);
    const riskCaseId = await routeParam(context, "id");
    const body = await readJsonObject(request);
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

    if (session.roleCode === "source_lawyer" && riskCase.reported_by_user_id !== session.userId) {
      throw new ApiError(403, "FORBIDDEN", "案源律师只能处理自己登记的风控工单");
    }

    let statusUpdate;

    try {
      statusUpdate = normalizeRiskCaseStatusUpdate(body, riskCase.status as RiskCaseStatus);
    } catch (error) {
      throw new ApiError(400, "BAD_REQUEST", error instanceof Error ? error.message : "风控状态参数不正确");
    }

    const now = new Date().toISOString();
    const changes: {
      owner_user_id: string;
      resolution_note?: string | null;
      resolved_at: string | null;
      status: RiskCaseStatus;
      updated_at: string;
    } = {
      owner_user_id: session.userId,
      resolved_at: statusUpdate.nextStatus === "resolved" ? now : null,
      status: statusUpdate.nextStatus,
      updated_at: now,
    };

    if (statusUpdate.action === "resolve") {
      changes.resolution_note = statusUpdate.resolutionNote;
    }

    if (statusUpdate.action === "reopen" && statusUpdate.resolutionNote) {
      changes.resolution_note = statusUpdate.resolutionNote;
    }

    const { data: updated, error: updateError } = await admin
      .from("risk_cases")
      .update(changes)
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
      action: "risk_cases.update_status",
      entityType: "risk_cases",
      entityId: riskCaseId,
      metadata: {
        action: statusUpdate.action,
        nextStatus: statusUpdate.nextStatus,
        previousStatus: riskCase.status,
        resolutionNote: statusUpdate.resolutionNote,
      },
      ...getAuditRequestContext(request),
    });

    const [enrichedRiskCase] = await enrichRiskCases(admin, [updated as RiskCaseRow]);

    return ok({ riskCase: enrichedRiskCase });
  } catch (error) {
    return handleApiError(error);
  }
}
