import type { SopPipelineStage } from "../constants/sop-pipeline-stages.js";

/**
 * SOP Outbox 事件载荷（`architecture.md` §3.2.6 · `aggregate_type=case_pipeline`）。
 *
 * JSON 字段采用 snake_case（与 U2 写入及 HTTP 202 响应一致）；解析器同时接受 camelCase 别名。
 */
export interface SopOutboxPayload {
  /** U3 消费阶段（`sop.media.ocr` / `sop.deep_research` / `sop.pdf_export`）。 */
  readonly stage: SopPipelineStage;
  /** 案件流水线 ID（对应 `outbox_events.aggregate_id` 当 `aggregate_type=case_pipeline`）。 */
  readonly pipeline_id: string;
  /** 负责律师用户 ID；可选，Worker 亦可从 `case_pipelines.lawyer_id` 查询。 */
  readonly lawyer_id?: string;
  /** 当前 SOP 步骤 code。 */
  readonly step_code: string;
  /** 产出物 ID；`sop.deep_research` / `sop.pdf_export` 必填。 */
  readonly artifact_id?: string;
  /** 卷宗 Storage 前缀 `{owner_id}/sops/{pipeline_id}/`；`sop.media.ocr` 可选（亦可经 `upload_session_id` 解析）。 */
  readonly storage_key_prefix?: string;
  /** 卷宗上传会话 ID；`sop.media.ocr` 可选。 */
  readonly upload_session_id?: string;
}

/** Outbox 聚合类型常量（文档注释用）。 */
export const SOP_OUTBOX_AGGREGATE_TYPE = "case_pipeline" as const;
