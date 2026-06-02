import { SOP_STAGE_MEDIA_OCR, type SopOutboxPayload } from "@lexos/shared";

/** {@link buildSopMediaOcrOutboxPayload} 入参。 */
export interface BuildSopMediaOcrOutboxPayloadInput {
  readonly pipelineId: string;
  readonly stepCode: string;
  /** 卷宗上传会话或对象键；Worker 从 payload 解析具体媒体。 */
  readonly uploadSessionId: string;
}

/**
 * 构建卷宗 TUS 完成后的 OCR/ASR Outbox 载荷（`stage=sop.media.ocr`）。
 */
export function buildSopMediaOcrOutboxPayload(
  input: BuildSopMediaOcrOutboxPayloadInput,
): SopOutboxPayload & { readonly upload_session_id: string } {
  return {
    stage: SOP_STAGE_MEDIA_OCR,
    pipeline_id: input.pipelineId,
    step_code: input.stepCode,
    upload_session_id: input.uploadSessionId,
  };
}
