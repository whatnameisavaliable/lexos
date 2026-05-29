import type {
  AuthContext,
  TranscriptionUploadCompleteBody,
} from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import pg from "pg";
import type { SupabaseEnvConfig } from "@lexos/shared/config";
import type { SupabaseStorageAdapter } from "../adapters/storage/supabase-storage.adapter.js";
import { assertTaskStatusTransition } from "../domain/task-state-machine.js";
import { buildQueuedPayload } from "../domain/outbox-payload.factory.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import type { OutboxRepository } from "../repositories/outbox.repository.js";
import type { TaskStateRepository } from "../repositories/task-state.repository.js";
import type { TranscriptionTaskRepository } from "../repositories/transcription-task.repository.js";
import type { TranscriptionTaskWriteRepository } from "../repositories/transcription-task-write.repository.js";
import type { UploadSessionRepository } from "../repositories/upload-session.repository.js";

export interface TranscriptionUploadCompleteResult {
  readonly taskId: string;
  readonly status: "queued";
}

/**
 * `POST /api/transcription/uploads/complete` 业务逻辑（单事务 + Outbox）。
 */
export class TranscriptionUploadCompleteService {
  private readonly pool: pg.Pool;

  constructor(
    supabaseEnv: SupabaseEnvConfig,
    private readonly taskRepository: TranscriptionTaskRepository,
    private readonly taskWriteRepository: TranscriptionTaskWriteRepository,
    private readonly uploadSessionRepository: UploadSessionRepository,
    private readonly storageAdapter: SupabaseStorageAdapter,
    private readonly taskStateRepository: TaskStateRepository,
    private readonly outboxRepository: OutboxRepository,
  ) {
    this.pool = new pg.Pool({
      connectionString: supabaseEnv.supabaseDbUrl,
      max: 10,
    });
  }

  /**
   * 校验 Storage 对象并完成上传会话，任务入队。
   */
  async complete(
    actor: AuthContext,
    accessToken: string,
    body: TranscriptionUploadCompleteBody,
  ): Promise<TranscriptionUploadCompleteResult> {
    const session = await this.uploadSessionRepository.findByIdForOwner(
      accessToken,
      body.uploadSessionId,
      actor.userId,
    );
    if (!session) {
      throw new AppHttpError(
        ErrorCode.UPLOAD_SESSION_INVALID,
        "Upload session not found",
      );
    }

    if (session.completedAt) {
      throw new AppHttpError(
        ErrorCode.UPLOAD_SESSION_INVALID,
        "Upload session already completed",
      );
    }

    const expiresAt = Date.parse(session.expiresAt);
    if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) {
      throw new AppHttpError(
        ErrorCode.UPLOAD_SESSION_INVALID,
        "Upload session expired",
      );
    }

    const task = await this.taskRepository.findById(accessToken, session.taskId);
    if (!task || task.status !== "uploading") {
      throw new AppHttpError(ErrorCode.TASK_INVALID_STATE, "Task is not uploading");
    }

    const objects = await this.storageAdapter.listObjectsByPrefix(
      session.storageKeyPrefix,
    );
    if (objects.length === 0) {
      throw new AppHttpError(
        ErrorCode.VALIDATION_FAILED,
        "No uploaded file found for this session",
      );
    }

    const totalBytes = objects.reduce(
      (sum, item) => sum + (item.sizeBytes ?? 0),
      0,
    );
    if (totalBytes > session.expectedMaxBytes) {
      throw new AppHttpError(
        ErrorCode.RESOURCE_LIMIT_EXCEEDED,
        "Uploaded size exceeds session limit",
      );
    }

    const primaryObject =
      objects.find((o) => o.name === task.sourceStorageKey) ?? objects[0];
    const sourceStorageKey = primaryObject.name;
    const outboxPayload = buildQueuedPayload({
      taskId: task.id,
      createdBy: task.createdBy,
      isMp4: task.isMp4,
    });

    assertTaskStatusTransition("uploading", "queued");

    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      await this.taskWriteRepository.updateForUploadComplete(client, task.id, {
        sourceStorageKey,
        durationSec: task.durationSec,
      });

      const transitioned = await this.taskStateRepository.transitionTaskStatus(
        client,
        task.id,
        "uploading",
        "queued",
      );
      if (!transitioned) {
        throw new AppHttpError(ErrorCode.TASK_INVALID_STATE, "Task status changed");
      }

      await this.uploadSessionRepository.markCompleted(client, session.id);

      await this.outboxRepository.insertInTransaction(client, {
        aggregateType: "transcription_task",
        aggregateId: task.id,
        eventType: "task.queued",
        payload: outboxPayload,
      });

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    return { taskId: task.id, status: "queued" };
  }
}
