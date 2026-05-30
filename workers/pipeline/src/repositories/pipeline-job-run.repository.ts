import type { PoolClient } from "pg";
import type { PipelineStage } from "@lexos/shared";

/** 幂等登记入参。 */
export interface PipelineJobRunBeginInput {
  readonly stage: PipelineStage;
  readonly outboxEventId: string;
  readonly taskId: string;
  readonly attempt?: number;
}

/** 幂等登记结果。 */
export interface PipelineJobRunBeginResult {
  readonly proceed: boolean;
  readonly runId?: string;
}

const PG_UNIQUE_VIOLATION = "23505";

/**
 * `pipeline_job_runs` 读写（`architecture.md` §3.2.5.1）。
 */
export class PipelineJobRunRepository {
  async tryBeginRun(
    client: PoolClient,
    input: PipelineJobRunBeginInput,
  ): Promise<PipelineJobRunBeginResult> {
    const attempt = input.attempt ?? 1;
    try {
      const result = await client.query<{ id: string }>(
        `INSERT INTO public.pipeline_job_runs (
           stage, outbox_event_id, attempt, task_id, status, started_at
         ) VALUES ($1, $2::uuid, $3, $4::uuid, 'running', now())
         RETURNING id`,
        [input.stage, input.outboxEventId, attempt, input.taskId],
      );
      return { proceed: true, runId: result.rows[0]?.id };
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code: string }).code === PG_UNIQUE_VIOLATION
      ) {
        const existing = await client.query<{ id: string }>(
          `SELECT id FROM public.pipeline_job_runs
           WHERE stage = $1 AND outbox_event_id = $2::uuid AND attempt = $3`,
          [input.stage, input.outboxEventId, attempt],
        );
        return { proceed: false, runId: existing.rows[0]?.id };
      }
      throw error;
    }
  }

  async markSucceeded(client: PoolClient, runId: string): Promise<void> {
    await client.query(
      `UPDATE public.pipeline_job_runs
       SET status = 'succeeded', finished_at = now()
       WHERE id = $1::uuid`,
      [runId],
    );
  }

  async markFailed(client: PoolClient, runId: string): Promise<void> {
    await client.query(
      `UPDATE public.pipeline_job_runs
       SET status = 'failed', finished_at = now()
       WHERE id = $1::uuid`,
      [runId],
    );
  }
}
