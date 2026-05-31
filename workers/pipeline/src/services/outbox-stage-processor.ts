import type { PipelineStageOutboxPayload } from "@lexos/shared";
import type { Pool } from "pg";
import type { OutboxEventRow } from "../repositories/outbox-event.repository.js";

/** 单条 Outbox 阶段处理结果。 */
export type StageProcessOutcome =
  | { readonly kind: "executed" }
  | { readonly kind: "skipped_duplicate" };

/**
 * 单条 Outbox 事件阶段处理器（M5-I 注册各 stage Handler）。
 */
export interface OutboxStageProcessor {
  /**
   * 执行 `payload.stage` 对应流水线阶段；成功时 Handler 内 `completeStage` 标记 `published_at`。
   */
  processStage(
    pool: Pool,
    event: OutboxEventRow,
    payload: PipelineStageOutboxPayload,
  ): Promise<StageProcessOutcome>;
}
