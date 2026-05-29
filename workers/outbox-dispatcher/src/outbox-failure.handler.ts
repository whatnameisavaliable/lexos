import { createClient } from "@supabase/supabase-js";
import type { PoolClient } from "pg";
import type { OutboxEventRow } from "./outbox-event.repository.js";

/** 超最大投递次数时的告警钩子（可注入测试替身）。 */
export type OutboxMaxAttemptsAlertHook = (
  event: OutboxEventRow,
  errorMessage: string,
) => void | Promise<void>;

/**
 * Outbox 投递失败后的审计与任务标记（`architecture.md` §3.7.4）。
 */
export class OutboxFailureHandler {
  private readonly client;

  constructor(
    supabaseUrl: string,
    serviceRoleKey: string,
    private readonly alertHook?: OutboxMaxAttemptsAlertHook,
  ) {
    this.client = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  /**
   * 写入审计、标记关联任务失败并触发告警钩子。
   */
  async handleMaxAttempts(
    pgClient: PoolClient,
    event: OutboxEventRow,
    lastError: string,
  ): Promise<void> {
    await this.client.rpc("append_audit_log", {
      p_actor_id: null,
      p_action: "task.fail",
      p_target_type: event.aggregateType,
      p_target_id: event.aggregateId,
      p_ip: null,
      p_user_agent: null,
      p_metadata: {
        reason: "outbox_publish_exhausted",
        outboxEventId: event.id,
        eventType: event.eventType,
        publishAttempts: event.publishAttempts,
        lastError,
      },
    });

    if (event.aggregateType === "transcription_task") {
      await pgClient.query(
        `UPDATE public.transcription_tasks
         SET error_code = 'INTERNAL_ERROR',
             error_message = $2,
             updated_at = now()
         WHERE id = $1::uuid`,
        [event.aggregateId, "Outbox publish failed after max attempts"],
      );

      await pgClient.query(
        `SELECT public.transition_task_status(
           $1::uuid,
           'queued'::public.transcription_task_status,
           'failed'::public.transcription_task_status
         )`,
        [event.aggregateId],
      );
    }

    await this.alertHook?.(event, lastError);
  }
}
