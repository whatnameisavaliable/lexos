import type {
  AuthContext,
  PipelineStage,
  PipelineStageOutboxPayload,
  TranscriptionTaskRetryBody,
} from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import type { SupabaseEnvConfig } from "@lexos/shared/config";
import pg from "pg";
import { assertTaskStatusTransition } from "../domain/task-state-machine.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import type { OutboxInsertRow, OutboxRepository } from "../repositories/outbox.repository.js";
import type { TaskStateRepository } from "../repositories/task-state.repository.js";
import type { TranscriptionTaskRepository } from "../repositories/transcription-task.repository.js";

export interface TranscriptionTaskRetryResult {
  readonly taskId: string;
  readonly status: string;
  readonly stage: PipelineStage;
}

/**
 * 转写任务重试（PRD-3.5-06 / §3.5.08）：上传成功后重跑后续阶段，或分项重试 LLM。
 */
export class TranscriptionTaskRetryService {
  private readonly pool: pg.Pool;

  constructor(
    supabaseEnv: SupabaseEnvConfig,
    private readonly taskRepository: TranscriptionTaskRepository,
    private readonly taskStateRepository: TaskStateRepository,
    private readonly outboxRepository: OutboxRepository,
  ) {
    this.pool = new pg.Pool({
      connectionString: supabaseEnv.supabaseDbUrl,
      max: 5,
    });
  }

  async retry(
    actor: AuthContext,
    accessToken: string,
    taskId: string,
    body: TranscriptionTaskRetryBody,
  ): Promise<TranscriptionTaskRetryResult> {
    const task = await this.taskRepository.findById(accessToken, taskId);
    if (!task || task.createdBy !== actor.userId) {
      throw new AppHttpError(ErrorCode.RESOURCE_NOT_FOUND, "Task not found");
    }

    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      const payload = await this.resolveRetryPayload(client, task, body);
      const outboxRow = toOutboxInsertRow(payload);

      if (body.scope === "pipeline") {
        assertTaskStatusTransition("failed", payload.resumeStatus);
        const ok = await this.taskStateRepository.transitionTaskStatus(
          client,
          taskId,
          "failed",
          payload.resumeStatus,
        );
        if (!ok) {
          throw new AppHttpError(ErrorCode.TASK_INVALID_STATE, "Task is not failed");
        }
        await client.query(
          `UPDATE public.transcription_tasks
           SET error_code = NULL,
               error_message = NULL,
               llm_polish_failed = false,
               llm_summary_failed = false,
               updated_at = now()
           WHERE id = $1::uuid`,
          [taskId],
        );
      } else {
        if (task.status !== "completed") {
          throw new AppHttpError(
            ErrorCode.TASK_INVALID_STATE,
            "LLM retry requires a completed task",
          );
        }
        if (body.scope === "polish" && !task.llmPolishFailed) {
          throw new AppHttpError(
            ErrorCode.OPERATION_NOT_ALLOWED,
            "Polish retry is only available when polish failed",
          );
        }
        if (body.scope === "summary" && !task.llmSummaryFailed) {
          throw new AppHttpError(
            ErrorCode.OPERATION_NOT_ALLOWED,
            "Summary retry is only available when summary failed",
          );
        }
        assertTaskStatusTransition("completed", "llm_running");
        const ok = await this.taskStateRepository.transitionTaskStatus(
          client,
          taskId,
          "completed",
          "llm_running",
        );
        if (!ok) {
          throw new AppHttpError(ErrorCode.TASK_INVALID_STATE, "Cannot start LLM retry");
        }
      }

      await this.outboxRepository.insertInTransaction(client, outboxRow);
      await client.query("COMMIT");

      return {
        taskId,
        status: body.scope === "pipeline" ? payload.resumeStatus : "llm_running",
        stage: payload.stage,
      };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  private async resolveRetryPayload(
    client: pg.PoolClient,
    task: Awaited<ReturnType<TranscriptionTaskRepository["findById"]>> & {},
    body: TranscriptionTaskRetryBody,
  ): Promise<PipelineStageOutboxPayload & { resumeStatus: "queued" | "asr_running" | "llm_running" }> {
    const base = {
      taskId: task.id,
      createdBy: task.createdBy,
      isMp4: task.isMp4,
    };

    if (body.scope === "polish") {
      return {
        ...base,
        stage: "llm",
        llmRetry: "polish",
        skipArchive: true,
        resumeStatus: "llm_running",
      };
    }
    if (body.scope === "summary") {
      return {
        ...base,
        stage: "llm",
        llmRetry: "summary",
        skipArchive: true,
        resumeStatus: "llm_running",
      };
    }

    const hasAsr = await this.hasAsrText(client, task.id);
    if (hasAsr) {
      return {
        ...base,
        stage: "llm",
        llmRetry: "all",
        resumeStatus: "llm_running",
      };
    }

    if (task.audioStorageKey) {
      return { ...base, stage: "asr", resumeStatus: "asr_running" };
    }

    const stage: PipelineStage = task.isMp4 ? "media.extract" : "media.preprocess";
    return { ...base, stage, resumeStatus: "queued" };
  }

  private async hasAsrText(client: pg.PoolClient, taskId: string): Promise<boolean> {
    const result = await client.query<{ asr_raw_json: unknown }>(
      `SELECT asr_raw_json FROM public.transcription_transcripts WHERE task_id = $1::uuid`,
      [taskId],
    );
    const raw = result.rows[0]?.asr_raw_json as
      | { segments?: Array<{ text?: string }> }
      | undefined;
    const text = (raw?.segments ?? [])
      .map((s) => s.text ?? "")
      .join("")
      .trim();
    return text.length > 0;
  }
}

function toOutboxInsertRow(
  payload: PipelineStageOutboxPayload & {
    readonly resumeStatus?: unknown;
  },
): OutboxInsertRow {
  const { resumeStatus: _resume, ...outboxPayload } = payload;
  return {
    aggregateType: "transcription_task",
    aggregateId: outboxPayload.taskId,
    eventType: `task.stage.${outboxPayload.stage}`,
    payload: outboxPayload as unknown as Readonly<Record<string, unknown>>,
  };
}
