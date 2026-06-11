import { ApiError, handleApiError, routeParam } from "@/lib/api/http";
import { getAuditRequestContext, writeAuditLog } from "@/lib/audit/log";
import { requireInternalSession } from "@/lib/auth/session";
import { SIGNED_DELIVERABLE_URL_SECONDS } from "@/lib/deliverables/files";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request, context: { params: Promise<{ id: string; deliverableId: string }> }) {
  try {
    const session = await requireInternalSession(["system_admin", "firm_admin", "source_lawyer", "handling_lawyer"]);
    const taskId = await routeParam(context, "id");
    const deliverableId = await routeParam(context, "deliverableId");
    const admin = createSupabaseAdminClient();

    const { data: task, error: taskError } = await admin
      .from("tasks")
      .select("id, source_lawyer_id, assigned_lawyer_id")
      .eq("id", taskId)
      .eq("organization_id", session.organizationId)
      .maybeSingle();

    if (taskError) {
      throw taskError;
    }

    if (!task) {
      throw new ApiError(404, "NOT_FOUND", "任务不存在");
    }

    const hasAccess =
      session.roleCode === "system_admin" ||
      session.roleCode === "firm_admin" ||
      (session.roleCode === "source_lawyer" && task.source_lawyer_id === session.userId) ||
      (session.roleCode === "handling_lawyer" && task.assigned_lawyer_id === session.userId);

    if (!hasAccess) {
      throw new ApiError(403, "FORBIDDEN", "无权下载该交付附件");
    }

    const { data: deliverable, error: deliverableError } = await admin
      .from("task_deliverables")
      .select("id, storage_bucket, storage_path, file_name")
      .eq("id", deliverableId)
      .eq("task_id", taskId)
      .eq("organization_id", session.organizationId)
      .maybeSingle();

    if (deliverableError) {
      throw deliverableError;
    }

    if (!deliverable?.storage_bucket || !deliverable.storage_path) {
      throw new ApiError(404, "NOT_FOUND", "交付附件不存在");
    }

    const { data: signed, error: signedError } = await admin.storage
      .from(deliverable.storage_bucket)
      .createSignedUrl(deliverable.storage_path, SIGNED_DELIVERABLE_URL_SECONDS, {
        download: deliverable.file_name ?? true,
      });

    if (signedError || !signed?.signedUrl) {
      throw signedError ?? new ApiError(404, "NOT_FOUND", "下载链接生成失败");
    }

    await writeAuditLog(admin, {
      ...getAuditRequestContext(request),
      action: "deliverables.download",
      actorUserId: session.userId,
      entityId: deliverableId,
      entityType: "task_deliverable",
      metadata: {
        fileName: deliverable.file_name,
        taskId,
      },
      organizationId: session.organizationId,
    });

    return Response.redirect(signed.signedUrl, 302);
  } catch (error) {
    return handleApiError(error);
  }
}
