import type { AuthContext, SopUploadCompleteBody } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import type { SupabaseEnvConfig } from "@lexos/shared/config";
import pg from "pg";
import type { SupabaseStorageAdapter } from "../adapters/storage/supabase-storage.adapter.js";
import { buildSopMediaOcrOutboxPayload } from "../domain/sop/build-sop-media-ocr-outbox-payload.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import type { CasePipelineRepository } from "../repositories/case-pipeline.repository.js";
import type { OutboxRepository } from "../repositories/outbox.repository.js";
import type { SopUploadSessionRepository } from "../repositories/sop-upload-session.repository.js";

export interface SopUploadCompleteResult {
  readonly pipelineId: string;
  readonly status: "queued";
}

/**
 * `POST /api/sops/uploads/complete`。
 */
export class SopUploadCompleteService {
  private readonly pool: pg.Pool;

  constructor(
    supabaseEnv: SupabaseEnvConfig,
    private readonly pipelineRepository: CasePipelineRepository,
    private readonly uploadSessionRepository: SopUploadSessionRepository,
    private readonly storageAdapter: SupabaseStorageAdapter,
    private readonly outboxRepository: OutboxRepository,
  ) {
    this.pool = new pg.Pool({
      connectionString: supabaseEnv.supabaseDbUrl,
      max: 10,
    });
  }

  async complete(
    actor: AuthContext,
    accessToken: string,
    body: SopUploadCompleteBody,
  ): Promise<SopUploadCompleteResult> {
    const session = await this.uploadSessionRepository.findByIdForOwner(
      accessToken,
      body.uploadSessionId,
      actor.userId,
    );
    if (!session) {
      throw new AppHttpError(ErrorCode.UPLOAD_SESSION_INVALID, "Upload session not found");
    }
    if (session.completedAt) {
      throw new AppHttpError(
        ErrorCode.UPLOAD_SESSION_INVALID,
        "Upload session already completed",
      );
    }
    const pipeline = await this.pipelineRepository.findPipelineForLawyer(
      accessToken,
      session.pipelineId,
    );
    if (!pipeline || pipeline.lawyerId !== actor.userId) {
      throw new AppHttpError(ErrorCode.AUTH_FORBIDDEN, "Pipeline access denied");
    }
    if (!pipeline.currentStepCode) {
      throw new AppHttpError(ErrorCode.OPERATION_NOT_ALLOWED, "Pipeline has no current step");
    }

    const objects = await this.storageAdapter.listObjectsByPrefix(session.storageKeyPrefix);
    if (objects.length === 0) {
      throw new AppHttpError(
        ErrorCode.VALIDATION_FAILED,
        "No uploaded SOP media file found",
      );
    }
    const invalid = objects.find((item) => !item.name.startsWith(session.storageKeyPrefix));
    if (invalid) {
      throw new AppHttpError(
        ErrorCode.UPLOAD_SESSION_INVALID,
        "Uploaded object key prefix mismatch",
      );
    }

    const payload = buildSopMediaOcrOutboxPayload({
      pipelineId: pipeline.id,
      stepCode: pipeline.currentStepCode,
      uploadSessionId: session.id,
    });

    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await this.uploadSessionRepository.markCompleted(client, session.id);
      await this.outboxRepository.insertSopOutboxInTransaction(client, {
        pipelineId: pipeline.id,
        stage: payload.stage,
        stepCode: payload.step_code,
      });
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    return { pipelineId: pipeline.id, status: "queued" };
  }
}
