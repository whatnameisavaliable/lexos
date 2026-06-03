import type {
  AdminSopCreateVersionBody,
  AdminSopPreviewPipelineBody,
  AdminSopStepUpsert,
  AdminSopTemplateCreateBody,
  AdminSopTemplateListItem,
  AdminSopTemplateStepDetail,
  AdminSopTemplateVersionDetail,
  AdminSopTemplateVersionSummary,
  AdminSopVersionPromptsUpsertBody,
} from "@lexos/shared";
import type { PaginationMeta } from "@lexos/shared/api";

export type {
  AdminSopCreateVersionBody,
  AdminSopPreviewPipelineBody,
  AdminSopStepUpsert,
  AdminSopTemplateCreateBody,
  AdminSopTemplateListItem,
  AdminSopTemplateStepDetail,
  AdminSopTemplateVersionDetail,
  AdminSopTemplateVersionSummary,
  AdminSopVersionPromptsUpsertBody,
};

/** `GET /api/admin/sops/templates/:id` 响应体。 */
export interface AdminSopTemplateDetail {
  readonly templateId: string;
  readonly name: string;
  readonly caseType: string;
  readonly createdAt: string;
  readonly versions: readonly AdminSopTemplateVersionSummary[];
}

/** `GET /api/admin/sops` 响应。 */
export interface AdminSopListData {
  readonly items: readonly AdminSopTemplateListItem[];
  readonly meta: PaginationMeta & { readonly limit?: number };
  readonly nextCursor?: string;
}

/** 列表查询参数。 */
export interface AdminSopListParams {
  readonly limit?: string;
  readonly cursor?: string;
}

/** `POST /api/admin/sops/templates` 响应。 */
export interface AdminSopTemplateCreateResult {
  readonly templateId: string;
  readonly versionId: string;
}

/** `POST .../publish` 响应。 */
export interface AdminSopVersionPublishResult {
  readonly versionId: string;
  readonly versionNumber: number;
}

/** `POST .../templates/:id/versions` 响应。 */
export interface AdminSopVersionCreateResult {
  readonly versionId: string;
}

/** `POST /api/admin/sops/preview-pipeline` 响应。 */
export interface AdminSopPreviewPipelineResult {
  readonly content: string;
  readonly modelId: string;
  readonly isFallback: boolean;
  readonly latencyMs: number;
}

/** `PUT .../prompts` 响应（版本详情快照）。 */
export type AdminSopVersionPromptsUpsertResult = AdminSopTemplateVersionDetail;
