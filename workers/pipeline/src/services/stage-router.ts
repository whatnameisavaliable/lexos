import type { PipelineStage } from "@lexos/shared";
import type { StageHandler } from "../handlers/stage-handler.js";

/**
 * `payload.stage` → Handler 映射表（`architecture.md` §3.2.1.3）。
 */
export class StageRouter {
  constructor(
    private readonly handlers: Readonly<Record<PipelineStage, StageHandler>>,
  ) {}

  /** 按阶段名解析 Handler。 */
  resolve(stage: PipelineStage): StageHandler {
    const handler = this.handlers[stage];
    if (!handler) {
      throw new Error(`No handler registered for stage: ${stage}`);
    }
    return handler;
  }
}
