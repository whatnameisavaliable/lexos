import type {
  ArtifactContentType,
  CasePipelineStatus,
  PipelineArtifactStatus,
  SopAsyncExecuteAccepted,
  SopArtifactPatchBody,
  SopPipelineCreateBody,
  SopPipelineStatusResponse,
  SopPipelineStepStatusItem,
  SopPublishedTemplateItem,
  SopStepExecuteBody,
  SopUploadCompleteBody,
  SopUploadInitBody,
  TranscriptionUploadInitResponse,
} from "@lexos/shared";

export type {
  SopPublishedTemplateItem,
  SopPipelineStatusResponse,
  SopPipelineStepStatusItem,
  SopAsyncExecuteAccepted,
  SopPipelineCreateBody,
  SopStepExecuteBody,
  SopArtifactPatchBody,
  SopUploadInitBody,
  SopUploadCompleteBody,
};

/** `POST /api/sops/pipelines` 成功响应。 */
export interface SopPipelineCreateResult {
  readonly id: string;
  readonly lawyerId: string;
  readonly templateVersionId: string;
  readonly status: CasePipelineStatus;
  readonly currentStepCode: string | null;
  readonly createdAt: string;
}

/** `GET /api/sops/artifacts/:id` 产出物详情。 */
export interface SopArtifactDetail {
  readonly id: string;
  readonly pipelineId: string;
  readonly stepCode: string;
  readonly contentType: ArtifactContentType;
  readonly contentRaw: string;
  readonly version: number;
  readonly status: PipelineArtifactStatus;
  readonly linkedDriveNodeId: string | null;
  readonly finalizedSnapshotRaw: string | null;
  readonly updatedBy: string | null;
  readonly updatedAt: string;
}

/** `PATCH /api/sops/artifacts/:id` 成功响应。 */
export interface SopArtifactPatchResult {
  readonly id: string;
  readonly version: number;
  readonly contentRaw: string;
  readonly updatedAt: string;
}

/** `POST /api/sops/artifacts/:id/verify` 成功响应。 */
export interface SopArtifactVerifyResult {
  readonly artifactId: string;
  readonly verified: true;
}

/** `POST /api/sops/uploads/complete` 成功响应。 */
export interface SopUploadCompleteResult {
  readonly pipelineId: string;
  readonly status: "queued";
}

/** SOP 卷宗 init 响应（与转写 init 同形）。 */
export type SopUploadInitResponse = TranscriptionUploadInitResponse;

/** 同步步骤 execute（HTTP 200）。 */
export interface SopStepExecuteSyncResult {
  readonly kind: "sync";
  readonly artifactId: string;
}

/** 异步步骤 execute（HTTP 202）。 */
export interface SopStepExecuteAsyncResult {
  readonly kind: "async";
  readonly accepted: SopAsyncExecuteAccepted;
}

/** `execute` 联合结果。 */
export type SopStepExecuteResult =
  | SopStepExecuteSyncResult
  | SopStepExecuteAsyncResult;

/** 模板列表查询参数。 */
export interface SopTemplatesListQuery {
  readonly limit?: number;
  readonly cursor?: string;
}

/** 模板列表响应（`GET /api/sops/templates`）。 */
export interface SopTemplatesListData {
  readonly items: readonly SopPublishedTemplateItem[];
  readonly nextCursor?: string;
}
