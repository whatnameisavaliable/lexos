import { Queue } from "bullmq";
import IORedis from "ioredis";
import type { TranscriptionQueuedOutboxPayload } from "@lexos/shared";

/** BullMQ Job 数据（U3 Worker 消费）。 */
export interface PipelineJobData {
  readonly taskId: string;
  readonly createdBy: string;
  readonly isMp4: boolean;
}

/**
 * 将 Outbox 载荷投递至 BullMQ（**本进程唯一**允许 `queue.add` 的位置）。
 */
export class BullMqPublisher {
  private readonly connection: IORedis;
  private readonly queues = new Map<string, Queue<PipelineJobData>>();

  /**
   * @param redisUrl - `REDIS_URL`
   */
  constructor(redisUrl: string) {
    this.connection = new IORedis(redisUrl, {
      maxRetriesPerRequest: null,
    });
  }

  /**
   * 按 `payload.queueName` 入队；`jobId` 绑定 `taskId` 以实现幂等。
   */
  async publish(payload: TranscriptionQueuedOutboxPayload): Promise<void> {
    const queue = this.getQueue(payload.queueName);
    const jobData: PipelineJobData = {
      taskId: payload.taskId,
      createdBy: payload.createdBy,
      isMp4: payload.isMp4,
    };

    await queue.add(payload.queueName, jobData, {
      jobId: `${payload.taskId}:${payload.queueName}`,
      removeOnComplete: true,
      removeOnFail: false,
    });
  }

  /** 关闭所有队列连接。 */
  async close(): Promise<void> {
    await Promise.all([...this.queues.values()].map((queue) => queue.close()));
    this.connection.disconnect();
  }

  private getQueue(name: string): Queue<PipelineJobData> {
    const existing = this.queues.get(name);
    if (existing) {
      return existing;
    }
    const queue = new Queue<PipelineJobData>(name, {
      connection: this.connection,
    });
    this.queues.set(name, queue);
    return queue;
  }
}
