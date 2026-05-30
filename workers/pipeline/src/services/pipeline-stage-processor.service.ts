import type { PipelineStageOutboxPayload } from "@lexos/shared";
import type { PoolClient } from "pg";
import type { OutboxEventRow } from "../repositories/outbox-event.repository.js";
import type { OutboxStageProcessor } from "./outbox-stage-processor.js";
import { StageIdempotencyMiddleware } from "../middleware/stage-idempotency.middleware.js";
import { WorkerOutboxRepository } from "../repositories/worker-outbox.repository.js";
import { StageErrorHandler } from "../handlers/stage-error.handler.js";
import type { StageRouter } from "./stage-router.js";

/**
 * Outbox 阶段处理器：幂等登记 → 路由 Handler → 成功/失败收尾。
 */
export class PipelineStageProcessorService implements OutboxStageProcessor {
  constructor(
    private readonly router: StageRouter,
    private readonly idempotency = new StageIdempotencyMiddleware(),
    private readonly outboxRepository = new WorkerOutboxRepository(),
    private readonly stageErrorHandler: StageErrorHandler,
  ) {}

  async processStage(
    client: PoolClient,
    event: OutboxEventRow,
    payload: PipelineStageOutboxPayload,
  ): Promise<void> {
    const idem = await this.idempotency.tryBeginRun(client, {
      stage: payload.stage,
      outboxEventId: event.id,
      taskId: payload.taskId,
    });

    if (!idem.proceed) {
      await this.outboxRepository.markPublished(client, event.id);
      return;
    }

    const runId = idem.existingRunId;
    try {
      const handler = this.router.resolve(payload.stage);
      await handler.handle({ client, event, payload });
      if (runId) {
        await this.idempotency.markSucceeded(client, runId);
      }
    } catch (error) {
      if (runId) {
        await this.idempotency.markFailed(client, runId);
      }
      await this.stageErrorHandler.handle(client, event, payload, error);
      throw error;
    }
  }
}
