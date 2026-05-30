import type { PoolClient } from "pg";
import type { TranscriptionTaskStatus } from "@lexos/shared";
import type { OutboxInsertRow } from "../repositories/worker-outbox.repository.js";
import { WorkerOutboxRepository } from "../repositories/worker-outbox.repository.js";
import { WorkerTaskRepository } from "../repositories/worker-task.repository.js";

/** 阶段完成事务入参。 */
export interface CompleteStageTransactionInput {
  readonly outboxEventId: string;
  readonly taskId: string;
  readonly fromStatus?: TranscriptionTaskStatus;
  readonly toStatus?: TranscriptionTaskStatus;
  readonly nextOutbox?: OutboxInsertRow | null;
}

/**
 * Worker 阶段切换同事务服务：`transition_task_status` + 下一阶段 Outbox + `published_at`。
 */
export class WorkerTransactionService {
  constructor(
    private readonly taskRepository = new WorkerTaskRepository(),
    private readonly outboxRepository = new WorkerOutboxRepository(),
  ) {}

  /**
   * 在单个 Postgres 事务内完成阶段收尾。
   */
  async completeStage(
    client: PoolClient,
    input: CompleteStageTransactionInput,
  ): Promise<void> {
    if (input.fromStatus && input.toStatus) {
      const transitioned = await this.taskRepository.transitionTaskStatus(
        client,
        input.taskId,
        input.fromStatus,
        input.toStatus,
      );
      if (!transitioned) {
        throw new Error(
          `transition_task_status failed: ${input.fromStatus} -> ${input.toStatus}`,
        );
      }
    }

    if (input.nextOutbox) {
      await this.outboxRepository.insertInTransaction(client, input.nextOutbox);
    }

    await this.outboxRepository.markPublished(client, input.outboxEventId);
  }
}
