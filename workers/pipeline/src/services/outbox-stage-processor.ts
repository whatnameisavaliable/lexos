import type { WorkerOutboxPayload } from "@lexos/shared";
import type { Pool } from "pg";
import type { OutboxEventRow } from "../repositories/outbox-event.repository.js";

/** 单条 Outbox 阶段处理结果。 */
export type StageProcessOutcome =
  | { readonly kind: "executed" }
  | { readonly kind: "skipped_duplicate" };

/**
 * 单条 Outbox 事件阶段处理器（转写五阶段 + SOP 三阶段）。
 */
export interface OutboxStageProcessor {
  /**
   * 执行 `payload.stage` 对应流水线阶段；成功时 Handler 内标记 `published_at`。
   */
  processStage(
    pool: Pool,
    event: OutboxEventRow,
    payload: WorkerOutboxPayload,
  ): Promise<StageProcessOutcome>;
}
