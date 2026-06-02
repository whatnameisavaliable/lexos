import type { SopPipelineStage } from "../constants/sop-pipeline-stages.js";

/**
 * SOP Outbox 事件载荷（`architecture.md` §3.2.6 · `aggregate_type=case_pipeline`）。
 */
export interface SopOutboxPayload {
  /** U3 消费阶段（`sop.media.ocr` / `sop.deep_research` / `sop.pdf_export`）。 */
  readonly stage: SopPipelineStage;
  /** 案件流水线 ID（对应 `outbox_events.aggregate_id` 当 `aggregate_type=case_pipeline`）。 */
  readonly pipeline_id: string;
  /** 当前 SOP 步骤 code。 */
  readonly step_code: string;
  /** 产出物 ID；PDF 导出等阶段必填。 */
  readonly artifact_id?: string;
}

/** Outbox 聚合类型常量（文档注释用）。 */
export const SOP_OUTBOX_AGGREGATE_TYPE = "case_pipeline" as const;
