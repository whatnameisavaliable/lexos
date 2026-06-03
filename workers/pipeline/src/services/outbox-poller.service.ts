import type { Pool } from "pg";
import type { WorkerOutboxPayload } from "@lexos/shared";
import type { OutboxRuntimeEnvConfig } from "@lexos/shared/config";
import { withPgClient } from "../infra/with-pg-client.js";
import { OutboxEventRepository } from "../repositories/outbox-event.repository.js";
import {
  OutboxFailureHandler,
  type OutboxMaxAttemptsAlertHook,
} from "./outbox-failure.handler.js";
import type { OutboxStageProcessor } from "./outbox-stage-processor.js";

/**
 * 轮询 `outbox_events` 并按 `payload.stage` 分发 Handler（`architecture.md` §3.7.3 · v1.3 无 Redis）。
 */
export class OutboxPollerService {
  private readonly repository = new OutboxEventRepository();
  private readonly failureHandler: OutboxFailureHandler;
  private timer: ReturnType<typeof setInterval> | null = null;
  private running = false;
  private pollCycleInFlight = false;

  constructor(
    private readonly env: OutboxRuntimeEnvConfig,
    private readonly pool: Pool,
    private readonly stageProcessor?: OutboxStageProcessor,
    alertHook?: OutboxMaxAttemptsAlertHook,
  ) {
    this.failureHandler = new OutboxFailureHandler(
      env.supabaseUrl,
      env.supabaseServiceRoleKey,
      alertHook,
    );
  }

  /** 启动定时轮询。 */
  start(): void {
    if (this.timer) {
      return;
    }
    void this.runPollCycle();
    this.timer = setInterval(() => {
      void this.runPollCycle();
    }, this.env.outboxPollIntervalMs);
  }

  private async runPollCycle(): Promise<void> {
    if (this.pollCycleInFlight) {
      return;
    }
    this.pollCycleInFlight = true;
    try {
      await this.pollOnce();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[pipeline-worker] poll cycle failed: ${message}`);
    } finally {
      this.pollCycleInFlight = false;
    }
  }

  /** 停止轮询（连接池由 `WorkerDbPool` 统一管理）。 */
  async stop(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /**
   * 执行一次轮询周期；返回成功处理条数。
   *
   * 先短事务领取 Outbox 行，再逐条处理（Handler 内自行借还连接，不在 FFmpeg/ASR 期间占用 pooler）。
   */
  async pollOnce(): Promise<number> {
    if (this.running) {
      return 0;
    }
    this.running = true;
    try {
      const events = await this.fetchLockedEventBatch();
      if (events.length === 0 || !this.stageProcessor) {
        return 0;
      }

      let processed = 0;
      for (const event of events) {
        let payload: WorkerOutboxPayload | null = null;
        try {
          payload = this.repository.parseWorkerPayload(event.payload);
          const outcome = await this.stageProcessor.processStage(
            this.pool,
            event,
            payload,
          );
          if (outcome.kind === "executed") {
            processed += 1;
            const subjectId =
              "taskId" in payload ? payload.taskId : payload.pipeline_id;
            console.info(
              `[pipeline-worker] stage ok ${"taskId" in payload ? "task" : "pipeline"}=${subjectId} stage=${payload.stage}`,
            );
          }
        } catch (error) {
          const message =
            error instanceof Error ? error.message : String(error);
          const subjectId =
            payload && "taskId" in payload
              ? payload.taskId
              : payload?.pipeline_id ?? event.aggregateId;
          const stage = payload?.stage ?? event.eventType;
          console.error(
            `[pipeline-worker] stage failed ${payload && "pipeline_id" in payload ? "pipeline" : "task"}=${subjectId} stage=${stage}: ${message}`,
          );
          await this.handleStageFailure(event, error);
        }
      }
      return processed;
    } finally {
      this.running = false;
    }
  }

  /** 短事务内 `FOR UPDATE SKIP LOCKED` 领取批次后立即提交。 */
  private async fetchLockedEventBatch(): Promise<
    Awaited<ReturnType<OutboxEventRepository["fetchUnpublishedBatch"]>>
  > {
    return withPgClient(this.pool, async (client) => {
      await client.query("BEGIN");
      try {
        const events = await this.repository.fetchUnpublishedBatch(
          client,
          this.env.outboxMaxAttempts,
        );
        await client.query("COMMIT");
        return events;
      } catch (error) {
        await client.query("ROLLBACK").catch(() => undefined);
        throw error;
      }
    });
  }

  private async handleStageFailure(
    event: import("../repositories/outbox-event.repository.js").OutboxEventRow,
    error: unknown,
  ): Promise<void> {
    const message =
      error instanceof Error ? error.message : "Unknown stage error";
    try {
      await withPgClient(this.pool, async (client) => {
        await client.query("BEGIN");
        try {
          const attempts = await this.repository.incrementPublishAttempts(
            client,
            event.id,
          );
          if (attempts >= this.env.outboxMaxAttempts) {
            await this.failureHandler.handleMaxAttempts(
              client,
              { ...event, publishAttempts: attempts },
              message,
            );
          }
          await client.query("COMMIT");
        } catch (txError) {
          await client.query("ROLLBACK").catch(() => undefined);
          throw txError;
        }
      });
    } catch (txError) {
      const txMessage =
        txError instanceof Error ? txError.message : String(txError);
      console.error(
        `[pipeline-worker] failed to record stage error for ${event.id}: ${txMessage}`,
      );
    }
  }
}
