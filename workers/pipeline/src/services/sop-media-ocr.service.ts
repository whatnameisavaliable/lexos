import path from "node:path";
import { AiFeatureKey, type SopOutboxPayload } from "@lexos/shared";
import type { Pool, PoolClient } from "pg";
import type { WorkerStorageAdapter } from "../adapters/storage/worker-storage.adapter.js";
import { concatSopMediaText } from "../domain/sop/concat-sop-media-text.js";
import { withPgClient } from "../infra/with-pg-client.js";
import type { WorkerCasePipelineRepository } from "../repositories/worker-case-pipeline.repository.js";
import type { WorkerPipelineArtifactRepository } from "../repositories/worker-pipeline-artifact.repository.js";
import type { WorkerSopMediaRepository } from "../repositories/worker-sop-media.repository.js";
import type { WorkerSopUploadSessionRepository } from "../repositories/worker-sop-upload-session.repository.js";
import type { AiOrchestrationService } from "./ai-orchestration.service.js";
import { WorkerAiRepository } from "../repositories/worker-ai.repository.js";

/**
 * `sop.media.ocr` 阶段：卷宗 Storage 对象 → ASR 文本 → `{{sop_media_extracted_text}}` 持久化。
 */
export class SopMediaOcrService {
  constructor(
    private readonly pipelineRepository: WorkerCasePipelineRepository,
    private readonly artifactRepository: WorkerPipelineArtifactRepository,
    private readonly mediaRepository: WorkerSopMediaRepository,
    private readonly uploadSessionRepository: WorkerSopUploadSessionRepository,
    private readonly storage: WorkerStorageAdapter,
    private readonly aiOrchestration: AiOrchestrationService,
    private readonly workerTmpDir: string,
  ) {}

  /**
   * 执行卷宗 OCR/ASR Outbox 阶段。
   */
  async run(pool: Pool, payload: SopOutboxPayload): Promise<void> {
    await withPgClient(pool, async (client) => {
      await this.pipelineRepository.assertLawyerPipelineWritable(
        client,
        payload.pipeline_id,
      );
    });

    const storageKeyPrefix = await this.resolveStorageKeyPrefix(
      pool,
      payload,
    );
    const objectKeys =
      await this.mediaRepository.listMediaObjectKeys(storageKeyPrefix);
    if (objectKeys.length === 0) {
      throw new Error("No SOP media objects found for OCR");
    }

    const chunks: { fileName: string; text: string }[] = [];
    for (const storageKey of objectKeys) {
      const localPath = path.join(
        this.workerTmpDir,
        "sop",
        payload.pipeline_id,
        path.basename(storageKey),
      );
      await this.downloadMediaObjectToTemp(storageKey, localPath);
      const text = await this.transcribeMediaFile(pool, payload, localPath);
      chunks.push({ fileName: path.basename(storageKey), text });
    }

    const combined = concatSopMediaText(chunks);
    await withPgClient(pool, (client) =>
      this.persistSopMediaExtractedText(client, payload.pipeline_id, combined),
    );
  }

  /** 从 Storage 下载卷宗媒体至 Worker 本地临时路径。 */
  async downloadMediaObjectToTemp(
    storageKey: string,
    localPath: string,
  ): Promise<void> {
    await this.storage.downloadToFile(storageKey, localPath);
  }

  /**
   * 对本地媒体文件执行 ASR（`asr_physical` 功能映射）。
   */
  async transcribeMediaFile(
    pool: Pool,
    payload: SopOutboxPayload,
    localPath: string,
  ): Promise<string> {
    const idempotencyKey = WorkerAiRepository.buildIdempotencyKey([
      "sop.media.ocr",
      payload.pipeline_id,
      payload.step_code,
      localPath,
    ]);
    const result = await this.aiOrchestration.invoke({
      pool,
      featureKey: AiFeatureKey.ASR_PHYSICAL,
      idempotencyKey,
      transcribePath: localPath,
      sop: {
        pipelineId: payload.pipeline_id,
        stepCode: payload.step_code,
      },
    });
    return result.text;
  }

  /**
   * 持久化卷宗提取文本（内部 KV：`pipeline_artifacts.__sop_media_extracted__`）。
   */
  async persistSopMediaExtractedText(
    client: PoolClient,
    pipelineId: string,
    text: string,
  ): Promise<void> {
    await this.artifactRepository.upsertMediaExtractedText(
      client,
      pipelineId,
      text,
    );
  }

  private async resolveStorageKeyPrefix(
    pool: Pool,
    payload: SopOutboxPayload,
  ): Promise<string> {
    if (payload.storage_key_prefix) {
      return payload.storage_key_prefix;
    }
    if (payload.upload_session_id) {
      const prefix = await withPgClient(pool, (client) =>
        this.uploadSessionRepository.findStorageKeyPrefix(
          client,
          payload.upload_session_id!,
        ),
      );
      if (prefix) {
        return prefix;
      }
    }
    const pipeline = await withPgClient(pool, (client) =>
      this.pipelineRepository.findPipelineWithLawyer(
        client,
        payload.pipeline_id,
      ),
    );
    if (!pipeline) {
      throw new Error(`case_pipelines not found: ${payload.pipeline_id}`);
    }
    return `${pipeline.lawyerId}/sops/${payload.pipeline_id}/`;
  }
}
