import { SOP_STAGE_PDF_EXPORT, type SopOutboxPayload } from "@lexos/shared";

/** {@link buildSopPdfExportOutboxPayload} 入参。 */
export interface BuildSopPdfExportOutboxPayloadInput {
  readonly pipelineId: string;
  readonly stepCode: string;
  readonly artifactId: string;
}

/**
 * 构建 HTML 定稿后 PDF 导出的 Outbox 载荷（`stage=sop.pdf_export`）。
 */
export function buildSopPdfExportOutboxPayload(
  input: BuildSopPdfExportOutboxPayloadInput,
): SopOutboxPayload {
  return {
    stage: SOP_STAGE_PDF_EXPORT,
    pipeline_id: input.pipelineId,
    step_code: input.stepCode,
    artifact_id: input.artifactId,
  };
}
