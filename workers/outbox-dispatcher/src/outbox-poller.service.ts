import pg from "pg";
import type { OutboxRuntimeEnvConfig } from "@lexos/shared/config";
import { BullMqPublisher } from "./bullmq-publisher.js";
import {
  OutboxFailureHandler,
  type OutboxMaxAttemptsAlertHook,
} from "./outbox-failure.handler.js";
import { OutboxEventRepository } from "./outbox-event.repository.js";

/**
 * 轮询 `outbox_events` 并投递 BullMQ（`architecture.md` §3.7.3）。
 */
export class OutboxPollerService {
  private readonly pool: pg.Pool;
  private readonly repository = new OutboxEventRepository();
  private readonly publisher: BullMqPublisher;
  private readonly failureHandler: OutboxFailureHandler;
  private timer: ReturnType<typeof setInterval> | null = null;
  private running = false;

  constructor(
    private readonly env: OutboxRuntimeEnvConfig,
    alertHook?: OutboxMaxAttemptsAlertHook,
  ) {
    this.pool = new pg.Pool({
      connectionString: env.outboxDbUrl,
      max: 5,
      application_name: "lexos-outbox-dispatcher",
    });
    this.publisher = new BullMqPublisher(env.redisUrl);
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
    await this.publisher.close();
    await this.pool.end();
  }

  /**
   * 执行一次轮询周期；返回成功发布条数。
   */
  async pollOnce(): Promise<number> {
    if (this.running) {
      return 0;
    }
    this.running = true;
    try {
      const client = await this.pool.connect();
      let published = 0;
      try {
        await client.query("BEGIN");
        const events = await this.repository.fetchUnpublishedBatch(
          client,
          this.env.outboxMaxAttempts,
        );

        for (const event of events) {
          try {
            const payload = this.repository.parsePipelinePayload(event.payload);
            await this.publisher.publish(payload);
            await this.repository.markPublished(client, event.id);
            published += 1;
          } catch (error) {
            const message =
              error instanceof Error ? error.message : "Unknown publish error";
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
      return published;
    } finally {
      this.running = false;
    }
  }
}
