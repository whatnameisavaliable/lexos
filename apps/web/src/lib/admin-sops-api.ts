import type {
  AdminSopCreateVersionBody,
  AdminSopPreviewPipelineBody,
  AdminSopTemplateCreateBody,
  AdminSopVersionPromptsUpsertBody,
} from "@lexos/shared";
import { apiFetch } from "./api-client";
import type {
  AdminSopListData,
  AdminSopListParams,
  AdminSopPreviewPipelineResult,
  AdminSopTemplateCreateResult,
  AdminSopTemplateDetail,
  AdminSopTemplateVersionDetail,
  AdminSopVersionCreateResult,
  AdminSopVersionPromptsUpsertResult,
  AdminSopVersionPublishResult,
} from "./admin-sops-api.types";

export type {
  AdminSopListData,
  AdminSopListParams,
  AdminSopPreviewPipelineResult,
  AdminSopTemplateCreateResult,
  AdminSopTemplateDetail,
  AdminSopTemplateListItem,
  AdminSopTemplateStepDetail,
  AdminSopTemplateVersionDetail,
  AdminSopTemplateVersionSummary,
  AdminSopVersionCreateResult,
  AdminSopVersionPromptsUpsertResult,
  AdminSopVersionPublishResult,
} from "./admin-sops-api.types";

/** 构建 SOP 列表 API 查询字符串（测试可覆盖）。 */
export function buildAdminSopsQueryString(params?: AdminSopListParams): string {
  if (!params) {
    return "";
  }
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      search.set(key, value);
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

/** `GET /api/admin/sops` */
export async function listAdminSops(
  params?: AdminSopListParams,
): Promise<AdminSopListData> {
  const res = await apiFetch<AdminSopListData>(
    `/admin/sops${buildAdminSopsQueryString(params)}`,
    { method: "GET" },
  );
  return res.data;
}

/** `POST /api/admin/sops/templates` */
export async function createAdminSopTemplate(
  body: AdminSopTemplateCreateBody,
): Promise<AdminSopTemplateCreateResult> {
  const res = await apiFetch<AdminSopTemplateCreateResult>("/admin/sops/templates", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return res.data;
}

/** `GET /api/admin/sops/templates/:templateId` */
export async function getAdminSopTemplate(
  templateId: string,
): Promise<AdminSopTemplateDetail> {
  const res = await apiFetch<AdminSopTemplateDetail>(
    `/admin/sops/templates/${templateId}`,
    { method: "GET" },
  );
  return res.data;
}

/** `GET /api/admin/sops/template-versions/:versionId` */
export async function getAdminSopTemplateVersion(
  versionId: string,
): Promise<AdminSopTemplateVersionDetail> {
  const res = await apiFetch<AdminSopTemplateVersionDetail>(
    `/admin/sops/template-versions/${versionId}`,
    { method: "GET" },
  );
  return res.data;
}

/** `PUT /api/admin/sops/template-versions/:versionId/prompts` */
export async function upsertAdminSopVersionPrompts(
  versionId: string,
  body: AdminSopVersionPromptsUpsertBody,
): Promise<AdminSopVersionPromptsUpsertResult> {
  const res = await apiFetch<AdminSopVersionPromptsUpsertResult>(
    `/admin/sops/template-versions/${versionId}/prompts`,
    {
      method: "PUT",
      body: JSON.stringify(body),
    },
  );
  return res.data;
}

/** `POST /api/admin/sops/template-versions/:versionId/publish` */
export async function publishAdminSopTemplateVersion(
  versionId: string,
): Promise<AdminSopVersionPublishResult> {
  const res = await apiFetch<AdminSopVersionPublishResult>(
    `/admin/sops/template-versions/${versionId}/publish`,
    { method: "POST" },
  );
  return res.data;
}

/** `POST /api/admin/sops/templates/:templateId/versions` */
export async function createAdminSopTemplateVersion(
  templateId: string,
  body?: AdminSopCreateVersionBody,
): Promise<AdminSopVersionCreateResult> {
  const res = await apiFetch<AdminSopVersionCreateResult>(
    `/admin/sops/templates/${templateId}/versions`,
    {
      method: "POST",
      body: JSON.stringify(body ?? {}),
    },
  );
  return res.data;
}

/** `POST /api/admin/sops/preview-pipeline` */
export async function previewAdminSopPipeline(
  body: AdminSopPreviewPipelineBody,
): Promise<AdminSopPreviewPipelineResult> {
  const res = await apiFetch<AdminSopPreviewPipelineResult>(
    "/admin/sops/preview-pipeline",
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
  return res.data;
}
