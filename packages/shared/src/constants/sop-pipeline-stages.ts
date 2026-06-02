/**
 * U3 SOP 流水线阶段名（`architecture.md` §3.2.6.2）。
 */
export const SOP_STAGE_MEDIA_OCR = "sop.media.ocr" as const;
export const SOP_STAGE_DEEP_RESEARCH = "sop.deep_research" as const;
export const SOP_STAGE_PDF_EXPORT = "sop.pdf_export" as const;

/** SOP Outbox `payload.stage` 合法取值（按架构文档顺序）。 */
export const SOP_PIPELINE_STAGES = [
  SOP_STAGE_MEDIA_OCR,
  SOP_STAGE_DEEP_RESEARCH,
  SOP_STAGE_PDF_EXPORT,
] as const;

/** SOP Worker 阶段字面量联合类型。 */
export type SopPipelineStage = (typeof SOP_PIPELINE_STAGES)[number];

/**
 * 判断字符串是否为已知 SOP 流水线阶段。
 */
export function isSopPipelineStage(value: string): value is SopPipelineStage {
  return (SOP_PIPELINE_STAGES as readonly string[]).includes(value);
}
