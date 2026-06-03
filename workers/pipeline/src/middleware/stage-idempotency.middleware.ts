import type { AllWorkerStage } from "@lexos/shared";
import type { PoolClient } from "pg";

/** 阶段幂等登记入参。 */
export interface StageIdempotencyInput {
  readonly stage: AllWorkerStage;
  readonly outboxEventId: string;
  readonly taskId: string;
  /** 重试序号；默认 1。 */
  readonly attempt?: number;
}

/** 阶段幂等检查结果。 */
export interface StageIdempotencyResult {
  /** `true` 表示首次消费，应继续执行 Handler。 */
  readonly proceed: boolean;
  /** 重复消费时的运行记录 id（若已存在）。 */
  readonly existingRunId?: string;
}

interface PipelineJobRunRow {
  readonly id: string;
}

const PG_UNIQUE_VIOLATION = "23505";

/**
 * 阶段幂等中间件：处理前写入 `pipeline_job_runs`（`architecture.md` §3.2.5.1）。
 */
export class StageIdempotencyMiddleware {
  /**
   * 尝试登记阶段运行；`UNIQUE(stage, outbox_event_id, attempt)` 冲突则跳过。
   */
  async tryBeginRun(
    client: PoolClient,
    input: StageIdempotencyInput,
  ): Promise<StageIdempotencyResult> {
    const attempt = input.attempt ?? 1;
    try {
      const result = await client.query<PipelineJobRunRow>(
        `INSERT INTO public.pipeline_job_runs (
           stage,
           outbox_event_id,
           attempt,
           task_id,
           status,
           started_at
         ) VALUES ($1, $2::uuid, $3, $4::uuid, 'running', now())
         RETURNING id`,
        [input.stage, input.outboxEventId, attempt, input.taskId],
      );
      return { proceed: true, existingRunId: result.rows[0]?.id };
    } catch (error) {
      if (isUniqueViolation(error)) {
        const existing = await client.query<PipelineJobRunRow>(
          `SELECT id
           FROM public.pipeline_job_runs
           WHERE stage = $1
             AND outbox_event_id = $2::uuid
             AND attempt = $3`,
          [input.stage, input.outboxEventId, attempt],
        );
        return {
          proceed: false,
          existingRunId: existing.rows[0]?.id,
        };
      }
      throw error;
    }
  }

  /** 标记阶段运行成功。 */
  async markSucceeded(
    client: PoolClient,
    runId: string,
  ): Promise<void> {
    await client.query(
      `UPDATE public.pipeline_job_runs
       SET status = 'succeeded',
           finished_at = now()
       WHERE id = $1::uuid`,
      [runId],
    );
  }

  /** 标记阶段运行失败。 */
  async markFailed(client: PoolClient, runId: string): Promise<void> {
    await client.query(
      `UPDATE public.pipeline_job_runs
       SET status = 'failed',
           finished_at = now()
       WHERE id = $1::uuid`,
      [runId],
    );
  }
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === PG_UNIQUE_VIOLATION
  );
}
