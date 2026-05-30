import type { Pool, PoolClient } from "pg";
import type { PipelineStage, TranscriptionTaskStatus } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { WorkerAuditAdapter } from "../../pipeline/src/adapters/audit/worker-audit.adapter.js";
import type { OutboxInsertRow } from "../../pipeline/src/repositories/worker-outbox.repository.js";
import { WorkerOutboxRepository } from "../../pipeline/src/repositories/worker-outbox.repository.js";
import { WorkerTaskRepository } from "../../pipeline/src/repositories/worker-task.repository.js";

/** Stalled 扫描配置。 */
export interface StalledTaskScannerConfig {
  readonly timeoutMs: number;
  readonly maxRetries: number;
}

interface StalledTaskRowDb {
  readonly id: string;
  readonly status: TranscriptionTaskStatus;
  readonly retry_count: number;
  readonly created_by: string;
  readonly is_mp4: boolean;
}

/**
 * Stalled 任务补偿（`architecture.md` §3.6.4.2）。
 */
export class StalledTaskScannerService {
  constructor(
    private readonly config: StalledTaskScannerConfig,
    private readonly auditAdapter: WorkerAuditAdapter,
    private readonly taskRepository = new WorkerTaskRepository(),
    private readonly outboxRepository = new WorkerOutboxRepository(),
  ) {}

  /** 扫描一次并补偿/失败 stalled 任务。 */
  async scanOnce(pool: Pool): Promise<number> {
    const client = await pool.connect();
    let recovered = 0;
    try {
      await client.query("BEGIN");
      const tasks = await this.fetchStalledTasks(client);
      for (const task of tasks) {
        if (task.retry_count < this.config.maxRetries) {
          await this.recoverTask(client, task);
          recovered += 1;
        } else {
          await this.failStalledTask(client, task);
        }
      }
      await client.query("COMMIT");
      return recovered;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  private async fetchStalledTasks(
    client: PoolClient,
  ): Promise<readonly StalledTaskRowDb[]> {
    const result = await client.query<StalledTaskRowDb>(
      `SELECT id, status, retry_count, created_by, is_mp4
       FROM public.transcription_tasks
       WHERE status IN ('extracting', 'preprocessing', 'asr_running', 'llm_running')
         AND deleted_at IS NULL
         AND last_progress_at < now() - ($1::bigint * interval '1 millisecond')
       FOR UPDATE SKIP LOCKED`,
      [this.config.timeoutMs],
    );
    return result.rows;
  }

  private async recoverTask(
    client: PoolClient,
    task: StalledTaskRowDb,
  ): Promise<void> {
    const transitioned = await this.taskRepository.transitionTaskStatus(
      client,
      task.id,
      task.status,
      "queued",
    );
    if (!transitioned) {
      return;
    }

    await client.query(
      `UPDATE public.transcription_tasks
       SET retry_count = retry_count + 1,
           updated_at = now()
       WHERE id = $1::uuid`,
      [task.id],
    );

    await this.outboxRepository.insertInTransaction(
      client,
      buildRecoveryOutbox(task),
    );

    await this.auditAdapter.appendStalledRecovery(task.id, {
      reason: "stalled_recovery",
      fromStatus: task.status,
      retryCount: task.retry_count + 1,
    });
  }

  private async failStalledTask(
    client: PoolClient,
    task: StalledTaskRowDb,
  ): Promise<void> {
    await this.taskRepository.failTask(
      client,
      task.id,
      task.status,
      ErrorCode.TASK_STALLED,
      "Task stalled beyond retry limit",
    );
    await this.auditAdapter.appendStalledRecovery(task.id, {
      reason: "stalled_exhausted",
      fromStatus: task.status,
      retryCount: task.retry_count,
    });
  }
}

function buildRecoveryOutbox(task: StalledTaskRowDb): OutboxInsertRow {
  const stage = recoveryStageForStatus(task.status);
  return {
    aggregateType: "transcription_task",
    aggregateId: task.id,
    eventType: `task.stage.${stage}`,
    payload: {
      stage,
      taskId: task.id,
      createdBy: task.created_by,
      isMp4: task.is_mp4,
    },
  };
}

function recoveryStageForStatus(
  status: TranscriptionTaskStatus,
): PipelineStage {
  switch (status) {
    case "extracting":
      return "media.extract";
    case "preprocessing":
      return "media.preprocess";
    case "asr_running":
      return "asr";
    case "llm_running":
      return "llm";
    default:
      throw new Error(`unsupported stalled status: ${status}`);
  }
}
