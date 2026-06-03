import type { Pool } from "pg";
import type { SopOutboxPayload } from "@lexos/shared";
import type { OutboxEventRow } from "../repositories/outbox-event.repository.js";

/** SOP 阶段 Handler 上下文。 */
export interface SopStageHandlerContext {
  readonly pool: Pool;
  readonly event: OutboxEventRow;
  readonly payload: SopOutboxPayload;
}

/** SOP 单阶段 Handler 接口（`architecture.md` §3.2.6.2）。 */
export interface SopStageHandler {
  handle(context: SopStageHandlerContext): Promise<void>;
}
