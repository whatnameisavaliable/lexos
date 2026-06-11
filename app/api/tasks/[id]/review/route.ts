import { ApiError, handleApiError, ok, routeParam } from "@/lib/api/http";
import { getAuditRequestContext, writeAuditLog } from "@/lib/audit/log";
import { requireInternalSession } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { canReviewTask, validateTaskReviewInput, type TaskReviewStatus } from "@/lib/tasks/review";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireInternalSession(["director"]);
    const taskId = await routeParam(context, "id");
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    let review;

    try {
      review = validateTaskReviewInput(body);
    } catch (error) {
      throw new ApiError(400, "BAD_REQUEST", error instanceof Error ? error.message : "审核参数不正确");
    }

    const admin = createSupabaseAdminClient();
    const { data: task, error: taskError } = await admin
      .from("tasks")
      .select("id, status, review_required, review_status, review_lawyer_id")
      .eq("id", taskId)
      .eq("organization_id", session.organizationId)
      .maybeSingle();

    if (taskError) {
      throw taskError;
    }

    if (
      !task ||
      !canReviewTask({
        currentUserId: session.userId,
        reviewLawyerId: task.review_lawyer_id ?? undefined,
        reviewRequired: task.review_required,
        reviewStatus: task.review_status as TaskReviewStatus,
        taskStatus: task.status,
        userRole: session.roleCode,
      })
    ) {
      throw new ApiError(409, "CONFLICT", "当前任务不可审核");
    }

    const now = new Date().toISOString();
    const { data: updated, error: updateError } = await admin
      .from("tasks")
      .update({
        review_comment: review.comment ?? null,
        review_lawyer_id: task.review_lawyer_id ?? session.userId,
        review_status: review.decision,
        reviewed_at: now,
        status: review.decision === "approved" ? "submitted" : "claimed",
      })
      .eq("id", taskId)
      .select("id, status, review_required, review_status, review_lawyer_id, reviewed_at, review_comment")
      .single();

    if (updateError) {
      throw updateError;
    }

    await writeAuditLog(admin, {
      organizationId: session.organizationId,
      actorUserId: session.userId,
      action: review.decision === "approved" ? "tasks.review_approve" : "tasks.review_changes_requested",
      entityType: "tasks",
      entityId: taskId,
      metadata: {
        comment: review.comment,
        decision: review.decision,
        reviewLawyerId: task.review_lawyer_id ?? session.userId,
      },
      ...getAuditRequestContext(request),
    });

    return ok({ task: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
