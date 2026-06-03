import {
  SOP_STAGE_DEEP_RESEARCH,
  SOP_STAGE_MEDIA_OCR,
  SOP_STAGE_PDF_EXPORT,
  type SopOutboxPayload,
} from "@lexos/shared";
import type { PoolClient } from "pg";
import type { OutboxEventRow } from "../repositories/outbox-event.repository.js";
import type { WorkerPipelineArtifactRepository } from "../repositories/worker-pipeline-artifact.repository.js";

/**
 * SOP 阶段失败收尾：写 `pipeline_artifacts.status=failed`（PDF 导出失败保持 `finalized`）。
 */
export class SopStageErrorHandler {
  constructor(
    private readonly artifactRepository: WorkerPipelineArtifactRepository,
  ) {}

  async handle(
    client: PoolClient,
    _event: OutboxEventRow,
    payload: SopOutboxPayload,
    _error: unknown,
  ): Promise<void> {
    if (payload.stage === SOP_STAGE_PDF_EXPORT) {
      return;
    }

    const artifactId = payload.artifact_id;
    if (!artifactId && payload.stage === SOP_STAGE_DEEP_RESEARCH) {
      return;
    }

    if (artifactId) {
      await this.artifactRepository.setArtifactStatus(
        client,
        artifactId,
        "failed",
      );
      return;
    }

    if (payload.stage === SOP_STAGE_MEDIA_OCR) {
      void payload;
    }
  }
}

/** 导出 stage 常量供测试。 */
export const SOP_ERROR_HANDLER_STAGES = {
  mediaOcr: SOP_STAGE_MEDIA_OCR,
  deepResearch: SOP_STAGE_DEEP_RESEARCH,
  pdfExport: SOP_STAGE_PDF_EXPORT,
} as const;
