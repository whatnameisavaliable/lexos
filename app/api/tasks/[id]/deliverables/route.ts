import { ApiError, handleApiError, ok, routeParam } from "@/lib/api/http";
import { getAuditRequestContext, writeAuditLog } from "@/lib/audit/log";
import { requireInternalSession } from "@/lib/auth/session";
import {
  DELIVERABLE_BUCKET,
  buildDeliverableStoragePath,
  detectDeliverableMimeType,
  sanitizeDeliverableFileName,
  validateDeliverableUpload,
} from "@/lib/deliverables/files";
import { lawyerRoles, transitionTaskStatus, type UserRole } from "@/lib/domain/core";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const lawyerAccessRoles: UserRole[] = [...lawyerRoles];

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  let uploadedStoragePath: string | undefined;

  try {
    const session = await requireInternalSession(lawyerAccessRoles);
    const taskId = await routeParam(context, "id");
    const formData = await request.formData();
    const title = requiredFormText(formData, "title", "成果标题");
    const content = optionalFormText(formData, "content");
    const externalUrl = optionalFormText(formData, "externalUrl");
    const file = formData.get("file");

    if (!(file instanceof File)) {
      throw new ApiError(400, "BAD_REQUEST", "请选择交付附件");
    }

    try {
      validateDeliverableUpload(file);
    } catch (error) {
      throw new ApiError(400, "BAD_REQUEST", error instanceof Error ? error.message : "交付附件无效");
    }

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

    const fileName = sanitizeDeliverableFileName(file.name);
    const fileMimeType = detectDeliverableMimeType(file);
    const storagePath = buildDeliverableStoragePath({
      fileName,
      organizationId: session.organizationId,
      taskId,
    });
    uploadedStoragePath = storagePath;

    const { error: uploadError } = await admin.storage.from(DELIVERABLE_BUCKET).upload(storagePath, file, {
      contentType: fileMimeType,
      upsert: false,
    });

    if (uploadError) {
      throw uploadError;
    }

    const { data: deliverable, error: deliverableError } = await admin
      .from("task_deliverables")
      .insert({
        organization_id: session.organizationId,
        task_id: taskId,
        submitted_by: session.userId,
        title,
        content,
        external_url: externalUrl,
        storage_bucket: DELIVERABLE_BUCKET,
        storage_path: storagePath,
        file_name: fileName,
        file_size_bytes: file.size,
        file_mime_type: fileMimeType,
      })
      .select("id, title, content, external_url, submitted_at, file_name, file_size_bytes, file_mime_type")
      .single();

    if (deliverableError) {
      await admin.storage.from(DELIVERABLE_BUCKET).remove([storagePath]);
      uploadedStoragePath = undefined;
      throw deliverableError;
    }

    uploadedStoragePath = undefined;

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
      ...getAuditRequestContext(request),
      action: "tasks.submit_file",
      actorUserId: session.userId,
      entityId: taskId,
      entityType: "task",
      metadata: {
        fileName,
        fileSizeBytes: file.size,
        hasExternalUrl: Boolean(externalUrl),
        title,
      },
      organizationId: session.organizationId,
    });

    return ok({ deliverable, task: updated });
  } catch (error) {
    if (uploadedStoragePath) {
      try {
        const admin = createSupabaseAdminClient();
        await admin.storage.from(DELIVERABLE_BUCKET).remove([uploadedStoragePath]);
      } catch {
        // Best-effort cleanup only.
      }
    }

    return handleApiError(error);
  }
}

function requiredFormText(formData: FormData, key: string, label: string): string {
  const value = formData.get(key);

  if (typeof value !== "string" || !value.trim()) {
    throw new ApiError(400, "BAD_REQUEST", `${label}不能为空`);
  }

  return value.trim();
}

function optionalFormText(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);

  if (value === null || value === "") {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new ApiError(400, "BAD_REQUEST", `${key}必须是字符串`);
  }

  return value.trim();
}
