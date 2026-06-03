import {
  isSopPipelineStage,
  type PipelineStageOutboxPayload,
  type SopOutboxPayload,
  type WorkerOutboxPayload,
} from "@lexos/shared";
import type { Pool } from "pg";
import type { OutboxEventRow } from "../repositories/outbox-event.repository.js";
import { withPgClient } from "../infra/with-pg-client.js";
import type {
  OutboxStageProcessor,
  StageProcessOutcome,
} from "./outbox-stage-processor.js";
import { StageIdempotencyMiddleware } from "../middleware/stage-idempotency.middleware.js";
import { WorkerOutboxRepository } from "../repositories/worker-outbox.repository.js";
import { StageErrorHandler } from "../handlers/stage-error.handler.js";
import { SopStageErrorHandler } from "../handlers/sop-stage-error.handler.js";
import type { StageRouter } from "./stage-router.js";
import type { SopStageRouter } from "./sop-stage-router.js";

function isSopOutboxPayload(
  payload: WorkerOutboxPayload,
): payload is SopOutboxPayload {
  return isSopPipelineStage(payload.stage);
}

/**
 * Outbox 阶段处理器：幂等登记 → 路由 Handler → 成功/失败收尾。
 */
export class PipelineStageProcessorService implements OutboxStageProcessor {
  constructor(
    private readonly router: StageRouter,
    private readonly sopRouter: SopStageRouter,
    private readonly idempotency = new StageIdempotencyMiddleware(),
    private readonly outboxRepository = new WorkerOutboxRepository(),
    private readonly stageErrorHandler: StageErrorHandler,
    private readonly sopStageErrorHandler: SopStageErrorHandler,
  ) {}

  async processStage(
    pool: Pool,
    event: OutboxEventRow,
    payload: WorkerOutboxPayload,
  ): Promise<StageProcessOutcome> {
    if (isSopOutboxPayload(payload)) {
      return this.processSopStage(pool, event, payload);
    }
    return this.processTranscriptionStage(
      pool,
      event,
      payload as PipelineStageOutboxPayload,
    );
  }

  private async processTranscriptionStage(
    pool: Pool,
    event: OutboxEventRow,
    payload: PipelineStageOutboxPayload,
  ): Promise<StageProcessOutcome> {
    const idem = await withPgClient(pool, (client) =>
      this.idempotency.tryBeginRun(client, {
        stage: payload.stage,
        outboxEventId: event.id,
        taskId: payload.taskId,
      }),
    );

    if (!idem.proceed) {
      await withPgClient(pool, async (client) => {
        await this.outboxRepository.markPublished(client, event.id);
        const failed = await client.query<{
          status: string;
          error_message: string | null;
        }>(
          `SELECT status, error_message
           FROM public.transcription_tasks
           WHERE id = $1::uuid`,
          [payload.taskId],
        );
        const row = failed.rows[0];
        if (row?.status === "failed") {
          console.warn(
            `[pipeline-worker] stage skipped (duplicate) task=${payload.taskId} stage=${payload.stage} — task already failed: ${row.error_message ?? "unknown"}`,
          );
        } else {
          console.info(
            `[pipeline-worker] stage skipped (duplicate) task=${payload.taskId} stage=${payload.stage}`,
          );
        }
      });
      return { kind: "skipped_duplicate" };
    }

    const runId = idem.existingRunId;
    try {
      const handler = this.router.resolve(payload.stage);
      await handler.handle({ pool, event, payload });
      if (runId) {
        await withPgClient(pool, (client) =>
          this.idempotency.markSucceeded(client, runId),
        );
      }
      return { kind: "executed" };
    } catch (error) {
      if (runId) {
        await withPgClient(pool, (client) =>
          this.idempotency.markFailed(client, runId),
        );
      }
      await withPgClient(pool, (client) =>
        this.stageErrorHandler.handle(client, event, payload, error),
      );
      throw error;
    }
  }

  private async processSopStage(
    pool: Pool,
    event: OutboxEventRow,
    payload: SopOutboxPayload,
  ): Promise<StageProcessOutcome> {
    const idem = await withPgClient(pool, (client) =>
      this.idempotency.tryBeginRun(client, {
        stage: payload.stage,
        outboxEventId: event.id,
        taskId: null,
      }),
    );

    if (!idem.proceed) {
      await withPgClient(pool, async (client) => {
        await this.outboxRepository.markPublished(client, event.id);
        console.info(
          `[pipeline-worker] SOP stage skipped (duplicate) pipeline=${payload.pipeline_id} stage=${payload.stage}`,
        );
      });
      return { kind: "skipped_duplicate" };
    }

    const runId = idem.existingRunId;
    try {
      const handler = this.sopRouter.resolve(payload.stage);
      await handler.handle({ pool, event, payload });
      if (runId) {
        await withPgClient(pool, (client) =>
          this.idempotency.markSucceeded(client, runId),
        );
      }
      return { kind: "executed" };
    } catch (error) {
      if (runId) {
        await withPgClient(pool, (client) =>
          this.idempotency.markFailed(client, runId),
        );
      }
      await withPgClient(pool, (client) =>
        this.sopStageErrorHandler.handle(client, event, payload, error),
      );
      throw error;
    }
  }
}
