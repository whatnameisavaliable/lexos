import type { PoolClient } from "pg";
import type { PipelineStageOutboxPayload } from "@lexos/shared";
import type { OutboxEventRow } from "../repositories/outbox-event.repository.js";

/** 阶段 Handler 上下文。 */
export interface StageHandlerContext {
  readonly client: PoolClient;
  readonly event: OutboxEventRow;
  readonly payload: PipelineStageOutboxPayload;
}

/** 单阶段 Handler 接口。 */
export interface StageHandler {
  handle(context: StageHandlerContext): Promise<void>;
}
