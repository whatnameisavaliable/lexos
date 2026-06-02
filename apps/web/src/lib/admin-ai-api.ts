import type {
  AiFeatureKey,
  AiFeatureMappingUpsertBody,
  AiModelCreateBody,
  AiModelPublic,
  AiModelUpdateBody,
  AiPromptCreateBody,
  AiPromptUpdateBody,
} from "@lexos/shared";
import type { PaginationMeta } from "@lexos/shared/api";
import { apiFetch } from "./api-client";

/** 功能-模型映射（API 响应）。 */
export interface AiFeatureMappingData {
  readonly featureKey: AiFeatureKey;
  readonly primaryModelId: string | null;
  readonly fallbackModelId: string | null;
  readonly updatedAt: string | null;
}

/** Prompt 模板（API 响应）。 */
export interface AiPromptData {
  readonly id: string;
  readonly featureKey: AiFeatureKey;
  readonly name: string;
  readonly systemPrompt: string;
  readonly version: number;
  readonly isPublished: boolean;
  readonly createdBy: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** 连通性测试结果。 */
export interface AiModelHealthcheckData {
  readonly modelId: string;
  readonly success: boolean;
  readonly latencyMs: number;
  readonly message?: string;
  readonly errorCode?: string;
}

/** AI 调用日志行。 */
export interface AiInvocationLogData {
  readonly id: string;
  readonly taskId: string | null;
  readonly featureKey: string;
  readonly modelId: string;
  readonly isFallback: boolean;
  readonly inputTokens: number | null;
  readonly outputTokens: number | null;
  readonly latencyMs: number;
  readonly outcome: string;
  readonly errorCode: string | null;
  readonly createdAt: string;
}

export interface AiModelListData {
  readonly items: readonly AiModelPublic[];
  readonly meta: PaginationMeta;
}

export interface AiModelListParams {
  readonly limit?: string;
  readonly cursor?: string;
  readonly providerKind?: string;
  readonly isEnabled?: string;
}

function buildQuery(params?: object): string {
  if (!params) return "";
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string" && value) search.set(key, value);
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

/** `GET /api/admin/ai/models` */
export async function listModels(
  params?: AiModelListParams,
): Promise<AiModelListData> {
  const res = await apiFetch<AiModelListData>(
    `/admin/ai/models${buildQuery(params)}`,
    { method: "GET" },
  );
  return res.data;
}

/** `GET /api/admin/ai/models/:id` */
export async function getModel(modelId: string): Promise<AiModelPublic> {
  const res = await apiFetch<AiModelPublic>(`/admin/ai/models/${modelId}`, {
    method: "GET",
  });
  return res.data;
}

/** `POST /api/admin/ai/models` */
export async function createModel(body: AiModelCreateBody): Promise<AiModelPublic> {
  const res = await apiFetch<AiModelPublic>("/admin/ai/models", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return res.data;
}

/** `PATCH /api/admin/ai/models/:id` */
export async function updateModel(
  modelId: string,
  body: AiModelUpdateBody,
): Promise<AiModelPublic> {
  const res = await apiFetch<AiModelPublic>(`/admin/ai/models/${modelId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  return res.data;
}

/** `DELETE /api/admin/ai/models/:id` */
export async function deleteModel(modelId: string): Promise<void> {
  await apiFetch<null>(`/admin/ai/models/${modelId}`, { method: "DELETE" });
}

/** `POST /api/admin/ai/models/:id/test` */
export async function testModel(modelId: string): Promise<AiModelHealthcheckData> {
  const res = await apiFetch<AiModelHealthcheckData>(
    `/admin/ai/models/${modelId}/test`,
    { method: "POST" },
  );
  return res.data;
}

/** `GET /api/admin/ai/mappings` */
export async function listMappings(): Promise<{ readonly items: readonly AiFeatureMappingData[] }> {
  const res = await apiFetch<{ readonly items: readonly AiFeatureMappingData[] }>(
    "/admin/ai/mappings",
    { method: "GET" },
  );
  return res.data;
}

/** `PUT /api/admin/ai/mappings/:featureKey` */
export async function upsertMapping(
  featureKey: AiFeatureKey,
  body: AiFeatureMappingUpsertBody,
): Promise<AiFeatureMappingData> {
  const res = await apiFetch<AiFeatureMappingData>(
    `/admin/ai/mappings/${featureKey}`,
    {
      method: "PUT",
      body: JSON.stringify(body),
    },
  );
  return res.data;
}

/** `GET /api/admin/ai/prompts` */
export async function listPrompts(): Promise<{ readonly items: readonly AiPromptData[] }> {
  const res = await apiFetch<{ readonly items: readonly AiPromptData[] }>(
    "/admin/ai/prompts",
    { method: "GET" },
  );
  return res.data;
}

/** `POST /api/admin/ai/prompts` */
export async function createPrompt(body: AiPromptCreateBody): Promise<AiPromptData> {
  const res = await apiFetch<AiPromptData>("/admin/ai/prompts", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return res.data;
}

/** `PATCH /api/admin/ai/prompts/:id` */
export async function updatePrompt(
  promptId: string,
  body: AiPromptUpdateBody,
): Promise<AiPromptData> {
  const res = await apiFetch<AiPromptData>(`/admin/ai/prompts/${promptId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  return res.data;
}

/** `DELETE /api/admin/ai/prompts/:id` */
export async function deletePrompt(promptId: string): Promise<void> {
  await apiFetch<null>(`/admin/ai/prompts/${promptId}`, { method: "DELETE" });
}

/** `POST /api/admin/ai/prompts/:id/publish` */
export async function publishPrompt(promptId: string): Promise<AiPromptData> {
  const res = await apiFetch<AiPromptData>(
    `/admin/ai/prompts/${promptId}/publish`,
    { method: "POST" },
  );
  return res.data;
}

/** `GET /api/admin/ai/invocation-logs` */
export async function listInvocationLogs(params?: {
  readonly limit?: string;
  readonly cursor?: string;
  readonly taskId?: string;
  readonly featureKey?: string;
  readonly outcome?: string;
}): Promise<{ readonly items: readonly AiInvocationLogData[]; readonly meta: PaginationMeta }> {
  const res = await apiFetch<{
    readonly items: readonly AiInvocationLogData[];
    readonly meta: PaginationMeta;
  }>(`/admin/ai/invocation-logs${buildQuery(params)}`, { method: "GET" });
  return res.data;
}
