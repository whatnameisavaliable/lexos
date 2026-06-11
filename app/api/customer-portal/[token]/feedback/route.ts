import { ApiError, handleApiError, ok, readJsonObject, routeParam, optionalStringField } from "@/lib/api/http";
import { getAuditRequestContext, writeAuditLog } from "@/lib/audit/log";
import { transitionTaskStatus } from "@/lib/domain/core";
import { createLowScoreRiskCase } from "@/lib/risk/low-score-service";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { buildPortalTokenHash, validateSettlementDraft } from "@/lib/workflow/validation";

export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  try {
    const token = await routeParam(context, "token");
    const body = await readJsonObject(request);
    const score = Number(body.score);

    if (!Number.isInteger(score) || score < 0 || score > 10) {
      throw new ApiError(400, "BAD_REQUEST", "评分必须是 0 到 10 的整数");
    }

    const comment = optionalStringField(body, "comment");
    const admin = createSupabaseAdminClient();
    const { data: link, error: linkError } = await admin
      .from("customer_portal_links")
      .select("id, organization_id, task_id, customer_id, status, last_verified_at")
      .eq("token_hash", buildPortalTokenHash(token))
      .maybeSingle();

    if (linkError) {
      throw linkError;
    }

    if (!link || link.status !== "active" || !link.last_verified_at) {
      throw new ApiError(401, "UNAUTHORIZED", "客户链接未通过验证");
    }

    const { data: task, error: taskError } = await admin
      .from("tasks")
      .select("id, title, status, amount_cents, assigned_lawyer_id")
      .eq("id", link.task_id)
      .maybeSingle();

    if (taskError) {
      throw taskError;
    }

    if (!task || task.status !== "approved" || !task.assigned_lawyer_id) {
      throw new ApiError(409, "CONFLICT", "当前任务不可客户确认");
    }

    const { data: member, error: memberError } = await admin
      .from("organization_members")
      .select("rank_id, ranks:rank_id(settlement_basis_points)")
      .eq("organization_id", link.organization_id)
      .eq("user_id", task.assigned_lawyer_id)
      .eq("role_code", "handling_lawyer")
      .eq("status", "active")
      .maybeSingle();

    if (memberError) {
      throw memberError;
    }

    const rank = Array.isArray(member?.ranks) ? member?.ranks[0] : member?.ranks;

    if (!member?.rank_id || !rank) {
      throw new ApiError(409, "CONFLICT", "办案律师职级缺失，无法生成结算");
    }

    const now = new Date().toISOString();
    const { error: feedbackError } = await admin.from("customer_feedback").insert({
      organization_id: link.organization_id,
      task_id: link.task_id,
      customer_id: link.customer_id,
      portal_link_id: link.id,
      confirmed_at: now,
      submitted_at: now,
      score,
      comment,
    });

    if (feedbackError) {
      throw feedbackError;
    }

    const settlementDraft = validateSettlementDraft({
      taskId: link.task_id,
      lawyerId: task.assigned_lawyer_id,
      rankId: member.rank_id,
      taskAmountCents: task.amount_cents,
      settlementBasisPoints: rank.settlement_basis_points,
    });

    const { data: settlement, error: settlementError } = await admin
      .from("settlements")
      .insert({
        organization_id: link.organization_id,
        task_id: settlementDraft.taskId,
        lawyer_id: settlementDraft.lawyerId,
        rank_id: settlementDraft.rankId,
        task_amount_cents: settlementDraft.taskAmountCents,
        settlement_basis_points: settlementDraft.settlementBasisPoints,
        settlement_amount_cents: settlementDraft.settlementAmountCents,
        payable_amount_cents: settlementDraft.settlementAmountCents,
        status: settlementDraft.status,
      })
      .select("id, status, settlement_amount_cents, payable_amount_cents")
      .single();

    if (settlementError) {
      throw settlementError;
    }

    const { error: taskUpdateError } = await admin
      .from("tasks")
      .update({
        status: transitionTaskStatus(transitionTaskStatus("approved", "customer_confirm"), "generate_settlement"),
        customer_confirmed_at: now,
        settlement_generated_at: now,
      })
      .eq("id", link.task_id);

    if (taskUpdateError) {
      throw taskUpdateError;
    }

    const auditContext = getAuditRequestContext(request);

    const riskCaseId = await createLowScoreRiskCase(admin, {
      auditContext,
      comment,
      customerId: link.customer_id,
      organizationId: link.organization_id,
      score,
      scoreLabel: "客户评分",
      taskId: link.task_id,
      taskTitle: task.title,
    });

    await writeAuditLog(admin, {
      organizationId: link.organization_id,
      action: "customer_portal.feedback",
      entityType: "tasks",
      entityId: link.task_id,
      metadata: {
        customerId: link.customer_id,
        riskCaseId,
        score,
        settlementId: settlement.id,
      },
      ...auditContext,
    });

    return ok({ settlement });
  } catch (error) {
    return handleApiError(error);
  }
}
