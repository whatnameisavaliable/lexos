import { ApiError, handleApiError, ok, readJsonObject, routeParam, stringField, optionalStringField } from "@/lib/api/http";
import { getAuditRequestContext, writeAuditLog } from "@/lib/audit/log";
import { requireInternalSession } from "@/lib/auth/session";
import { lawyerRoles, transitionTaskStatus, type UserRole } from "@/lib/domain/core";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const lawyerAccessRoles: UserRole[] = [...lawyerRoles];

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireInternalSession(lawyerAccessRoles);
    const taskId = await routeParam(context, "id");
    const body = await readJsonObject(request);
    const title = stringField(body, "title", "成果标题");
    const content = optionalStringField(body, "content");
    const externalUrl = optionalStringField(body, "externalUrl");
    const admin = createSupabaseAdminClient();

    const { data: task, error: taskError } = await admin
      .from("tasks")
      .select("id, status, assigned_lawyer_id, review_required")
      .eq("id", taskId)
      .eq("organization_id", session.organizationId)
      .maybeSingle();

    if (taskError) {
      throw taskError;
    }

    if (!task || task.assigned_lawyer_id !== session.userId || task.status !== "claimed") {
      throw new ApiError(409, "CONFLICT", "当前任务不可提交");
    }

    const { error: deliverableError } = await admin.from("task_deliverables").insert({
      organization_id: session.organizationId,
      task_id: taskId,
      submitted_by: session.userId,
      title,
      content,
      external_url: externalUrl,
    });

    if (deliverableError) {
      throw deliverableError;
    }

    const { data: updated, error: updateError } = await admin
      .from("tasks")
      .update({
        review_status: task.review_required ? "pending" : "not_required",
        review_comment: null,
        reviewed_at: null,
        status: transitionTaskStatus("claimed", "submit"),
        submitted_at: new Date().toISOString(),
      })
      .eq("id", taskId)
      .select("id, status, submitted_at")
      .single();

    if (updateError) {
      throw updateError;
    }

    await writeAuditLog(admin, {
      organizationId: session.organizationId,
      actorUserId: session.userId,
      action: "tasks.submit",
      entityType: "tasks",
      entityId: taskId,
      metadata: { title, hasExternalUrl: Boolean(externalUrl) },
      ...getAuditRequestContext(request),
    });

    return ok({ task: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
