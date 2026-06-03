import type {
  SopArtifactPatchBody,
  SopPipelineCreateBody,
  SopStepExecuteBody,
  SopUploadCompleteBody,
  SopUploadInitBody,
} from "@lexos/shared";
import type { SopAsyncExecuteAccepted } from "@lexos/shared";
import { apiFetch } from "./api-client";
import type {
  SopArtifactDetail,
  SopArtifactPatchResult,
  SopArtifactVerifyResult,
  SopPipelineCreateResult,
  SopPipelineStatusResponse,
  SopStepExecuteResult,
  SopTemplatesListData,
  SopTemplatesListQuery,
  SopUploadCompleteResult,
  SopUploadInitResponse,
} from "./lawyer-sops-api.types";

export type {
  SopArtifactDetail,
  SopArtifactPatchResult,
  SopArtifactVerifyResult,
  SopPipelineCreateResult,
  SopPipelineStatusResponse,
  SopPublishedTemplateItem,
  SopStepExecuteResult,
  SopTemplatesListData,
  SopTemplatesListQuery,
  SopUploadCompleteResult,
  SopUploadInitResponse,
} from "./lawyer-sops-api.types";

/**
 * 构建律师 SOP 模板列表查询字符串。
 */
export function buildSopTemplatesQueryString(
  query?: SopTemplatesListQuery,
): string {
  if (!query) {
    return "";
  }
  const search = new URLSearchParams();
  if (query.limit !== undefined) {
    search.set("limit", String(query.limit));
  }
  if (query.cursor) {
    search.set("cursor", query.cursor);
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

function isAsyncExecuteAccepted(
  data: { readonly artifactId: string } | SopAsyncExecuteAccepted,
): data is SopAsyncExecuteAccepted {
  return "stepCode" in data && "pipelineId" in data;
}

/** `GET /api/sops/templates` */
export async function listSopTemplates(
  query?: SopTemplatesListQuery,
): Promise<SopTemplatesListData> {
  const res = await apiFetch<SopTemplatesListData>(
    `/sops/templates${buildSopTemplatesQueryString(query)}`,
    { method: "GET" },
  );
  return res.data;
}

/** `POST /api/sops/pipelines` */
export async function createSopPipeline(
  body: SopPipelineCreateBody,
): Promise<SopPipelineCreateResult> {
  const res = await apiFetch<SopPipelineCreateResult>("/sops/pipelines", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return res.data;
}

/** `GET /api/sops/pipelines/:id/status` */
export async function getSopPipelineStatus(
  pipelineId: string,
): Promise<SopPipelineStatusResponse> {
  const res = await apiFetch<SopPipelineStatusResponse>(
    `/sops/pipelines/${encodeURIComponent(pipelineId)}/status`,
    { method: "GET" },
  );
  return res.data;
}

/** `POST /api/sops/pipelines/:id/resume` */
export async function resumeSopPipeline(
  pipelineId: string,
): Promise<SopPipelineCreateResult> {
  const res = await apiFetch<SopPipelineCreateResult>(
    `/sops/pipelines/${encodeURIComponent(pipelineId)}/resume`,
    { method: "POST" },
  );
  return res.data;
}

/** `POST /api/sops/pipelines/:id/close` */
export async function closeSopPipeline(
  pipelineId: string,
): Promise<SopPipelineCreateResult> {
  const res = await apiFetch<SopPipelineCreateResult>(
    `/sops/pipelines/${encodeURIComponent(pipelineId)}/close`,
    { method: "POST" },
  );
  return res.data;
}

/** `POST /api/sops/uploads/init` */
export async function initSopUpload(
  body: SopUploadInitBody,
): Promise<SopUploadInitResponse> {
  const res = await apiFetch<SopUploadInitResponse>("/sops/uploads/init", {
    method: "POST",
    body: JSON.stringify({
      ...body,
      sizeBytes: Number(body.sizeBytes),
    }),
  });
  return res.data;
}

/** `POST /api/sops/uploads/complete` */
export async function completeSopUpload(
  body: SopUploadCompleteBody,
): Promise<SopUploadCompleteResult> {
  const res = await apiFetch<SopUploadCompleteResult>("/sops/uploads/complete", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return res.data;
}

/** `POST /api/sops/pipelines/:id/steps/:code/execute`（200 同步 / 202 异步）。 */
export async function executeSopStep(
  pipelineId: string,
  stepCode: string,
  body: SopStepExecuteBody,
): Promise<SopStepExecuteResult> {
  const res = await apiFetch<
    { readonly artifactId: string } | SopAsyncExecuteAccepted
  >(
    `/sops/pipelines/${encodeURIComponent(pipelineId)}/steps/${encodeURIComponent(stepCode)}/execute`,
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
  if (isAsyncExecuteAccepted(res.data)) {
    return { kind: "async", accepted: res.data };
  }
  return { kind: "sync", artifactId: res.data.artifactId };
}

/** `POST /api/sops/pipelines/:id/steps/:code/finalize` */
export async function finalizeSopStep(
  pipelineId: string,
  stepCode: string,
): Promise<SopArtifactDetail> {
  const res = await apiFetch<SopArtifactDetail>(
    `/sops/pipelines/${encodeURIComponent(pipelineId)}/steps/${encodeURIComponent(stepCode)}/finalize`,
    { method: "POST" },
  );
  return res.data;
}

/** `GET /api/sops/artifacts/:id` */
export async function getSopArtifact(artifactId: string): Promise<SopArtifactDetail> {
  const res = await apiFetch<SopArtifactDetail>(
    `/sops/artifacts/${encodeURIComponent(artifactId)}`,
    { method: "GET" },
  );
  return res.data;
}

/** `PATCH /api/sops/artifacts/:id`（`If-Match` 乐观锁）。 */
export async function patchSopArtifact(
  artifactId: string,
  version: number,
  body: SopArtifactPatchBody,
): Promise<SopArtifactPatchResult> {
  const res = await apiFetch<SopArtifactPatchResult>(
    `/sops/artifacts/${encodeURIComponent(artifactId)}`,
    {
      method: "PATCH",
      headers: { "If-Match": String(version) },
      body: JSON.stringify(body),
    },
  );
  return res.data;
}

/** `POST /api/sops/artifacts/:id/verify` */
export async function verifySopArtifact(
  artifactId: string,
): Promise<SopArtifactVerifyResult> {
  const res = await apiFetch<SopArtifactVerifyResult>(
    `/sops/artifacts/${encodeURIComponent(artifactId)}/verify`,
    { method: "POST" },
  );
  return res.data;
}

/** `POST /api/sops/artifacts/:id/regenerate-pdf` */
export async function regenerateSopArtifactPdf(
  artifactId: string,
): Promise<{ readonly artifactId: string; readonly queued: true }> {
  const res = await apiFetch<{ readonly artifactId: string; readonly queued: true }>(
    `/sops/artifacts/${encodeURIComponent(artifactId)}/regenerate-pdf`,
    { method: "POST" },
  );
  return res.data;
}
