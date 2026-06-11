import { ApiError, handleApiError, routeParam } from "@/lib/api/http";
import { getAuditRequestContext, writeAuditLog } from "@/lib/audit/log";
import { SIGNED_DELIVERABLE_URL_SECONDS } from "@/lib/deliverables/files";
import { canCustomerDownloadDeliverable } from "@/lib/domain/portal";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { buildPortalTokenHash } from "@/lib/workflow/validation";
import type { TaskStatus } from "@/lib/domain/core";

export async function GET(request: Request, context: { params: Promise<{ token: string; deliverableId: string }> }) {
  try {
    const token = await routeParam(context, "token");
    const deliverableId = await routeParam(context, "deliverableId");
    const admin = createSupabaseAdminClient();
    const { data: link, error: linkError } = await admin
      .from("customer_portal_links")
      .select("id, organization_id, task_id, customer_id, status, last_verified_at, tasks:task_id(id, status)")
      .eq("token_hash", buildPortalTokenHash(token))
      .maybeSingle();

    if (linkError) {
      throw linkError;
    }

    if (!link || link.status !== "active") {
      throw new ApiError(404, "NOT_FOUND", "客户链接不存在或已失效");
    }

    if (!link.last_verified_at) {
      throw new ApiError(401, "UNAUTHORIZED", "请先完成验证码校验");
    }

    const task = Array.isArray(link.tasks) ? link.tasks[0] : link.tasks;

    if (!task || !canCustomerDownloadDeliverable(task.status as TaskStatus)) {
      throw new ApiError(403, "FORBIDDEN", "任务验收前暂不能下载交付附件");
    }

    const { data: deliverable, error: deliverableError } = await admin
      .from("task_deliverables")
      .select("id, storage_bucket, storage_path, file_name")
      .eq("id", deliverableId)
      .eq("task_id", link.task_id)
      .eq("organization_id", link.organization_id)
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
      action: "customer_portal.deliverable_download",
      entityId: deliverableId,
      entityType: "task_deliverable",
      metadata: {
        customerId: link.customer_id,
        fileName: deliverable.file_name,
        taskId: link.task_id,
      },
      organizationId: link.organization_id,
    });

    return Response.redirect(signed.signedUrl, 302);
  } catch (error) {
    return handleApiError(error);
  }
}
