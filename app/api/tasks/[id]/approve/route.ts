import { ApiError, handleApiError, ok, routeParam } from "@/lib/api/http";
import { getAuditRequestContext, writeAuditLog } from "@/lib/audit/log";
import { requireInternalSession } from "@/lib/auth/session";
import { transitionTaskStatus } from "@/lib/domain/core";
import { validateSourceReviewInput } from "@/lib/reviews/source-review";
import { createLowScoreRiskCase } from "@/lib/risk/low-score-service";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isTaskReviewSatisfied, type TaskReviewStatus } from "@/lib/tasks/review";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireInternalSession(["source_lawyer", "system_admin", "firm_admin"]);
    const taskId = await routeParam(context, "id");
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    let review;

    try {
      review = validateSourceReviewInput(body);
    } catch (error) {
      throw new ApiError(400, "BAD_REQUEST", error instanceof Error ? error.message : "评分参数不正确");
    }

    const now = new Date().toISOString();
    const admin = createSupabaseAdminClient();
    const { data: task, error: taskError } = await admin
      .from("tasks")
      .select("id, title, customer_id, status, source_lawyer_id, review_required, review_status")
      .eq("id", taskId)
      .eq("organization_id", session.organizationId)
      .maybeSingle();

    if (taskError) {
      throw taskError;
    }

    if (!task || task.status !== "submitted") {
      throw new ApiError(409, "CONFLICT", "当前任务不可验收");
    }

    if (session.roleCode === "source_lawyer" && task.source_lawyer_id !== session.userId) {
      throw new ApiError(403, "FORBIDDEN", "只能验收自己发布的任务");
    }

    if (!isTaskReviewSatisfied({ reviewRequired: task.review_required, reviewStatus: task.review_status as TaskReviewStatus })) {
      throw new ApiError(409, "CONFLICT", "该任务需要先完成审核律师复核");
    }

    const { data: updated, error: updateError } = await admin
      .from("tasks")
      .update({
        status: transitionTaskStatus("submitted", "approve"),
        approved_at: now,
        case_result_score: review.caseResultScore ?? null,
        case_result_summary: review.caseResultSummary ?? null,
        source_review_comment: review.sourceReviewComment ?? null,
        source_review_score: review.sourceReviewScore ?? null,
        source_reviewed_at: review.sourceReviewScore || review.caseResultScore ? now : null,
      })
      .eq("id", taskId)
      .select("id, status, approved_at, source_review_score, source_review_comment, source_reviewed_at, case_result_score, case_result_summary")
      .single();

    if (updateError) {
      throw updateError;
    }

    const auditContext = getAuditRequestContext(request);
    const lowScoreRiskCaseId =
      (await createLowScoreRiskCase(admin, {
        auditContext,
        comment: review.sourceReviewComment,
        customerId: task.customer_id,
        organizationId: session.organizationId,
        reportedByUserId: session.userId,
        score: review.sourceReviewScore,
        scoreLabel: "案源评分",
        taskId,
        taskTitle: task.title,
      })) ??
      (await createLowScoreRiskCase(admin, {
        auditContext,
        comment: review.caseResultSummary,
        customerId: task.customer_id,
        organizationId: session.organizationId,
        reportedByUserId: session.userId,
        score: review.caseResultScore,
        scoreLabel: "案件结果评分",
        taskId,
        taskTitle: task.title,
      }));

    await writeAuditLog(admin, {
      organizationId: session.organizationId,
      actorUserId: session.userId,
      action: "tasks.approve",
      entityType: "tasks",
      entityId: taskId,
      metadata: {
        caseResultScore: review.caseResultScore,
        lowScoreRiskCaseId,
        sourceLawyerId: task.source_lawyer_id,
        sourceReviewScore: review.sourceReviewScore,
      },
      ...auditContext,
    });

    return ok({ task: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
