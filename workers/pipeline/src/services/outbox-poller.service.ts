import pg from "pg";
import type { OutboxRuntimeEnvConfig } from "@lexos/shared/config";
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
  private readonly pool: pg.Pool;
  private readonly repository = new OutboxEventRepository();
  private readonly failureHandler: OutboxFailureHandler;
  private timer: ReturnType<typeof setInterval> | null = null;
  private running = false;

  constructor(
    private readonly env: OutboxRuntimeEnvConfig,
    private readonly stageProcessor?: OutboxStageProcessor,
    alertHook?: OutboxMaxAttemptsAlertHook,
  ) {
    this.pool = new pg.Pool({
      connectionString: env.outboxDbUrl,
      max: 5,
      application_name: "lexos-pipeline-worker",
    });
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
    void this.pollOnce();
    this.timer = setInterval(() => {
      void this.pollOnce();
    }, this.env.outboxPollIntervalMs);
  }

  /** 停止轮询并释放连接。 */
  async stop(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    await this.pool.end();
  }

  /**
   * 执行一次轮询周期；返回成功处理条数。
   */
  async pollOnce(): Promise<number> {
    if (this.running) {
      return 0;
    }
    this.running = true;
    try {
      const client = await this.pool.connect();
      let processed = 0;
      try {
        await client.query("BEGIN");
        const events = await this.repository.fetchUnpublishedBatch(
          client,
          this.env.outboxMaxAttempts,
        );

        for (const event of events) {
          if (!this.stageProcessor) {
            continue;
          }
          try {
            const payload = this.repository.parsePipelinePayload(event.payload);
            await this.stageProcessor.processStage(event, payload);
            await this.repository.markPublished(client, event.id);
            processed += 1;
          } catch (error) {
            const message =
              error instanceof Error ? error.message : "Unknown stage error";
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
          }
        }

        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
      return processed;
    } finally {
      this.running = false;
    }
  }
}
