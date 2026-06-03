import type { SopPipelineStage } from "@lexos/shared";
import type { SopStageHandler } from "../handlers/sop-stage-handler.js";

/**
 * SOP `payload.stage` → Handler 映射表（`architecture.md` §3.2.6.2）。
 */
export class SopStageRouter {
  constructor(
    private readonly handlers: Partial<
      Readonly<Record<SopPipelineStage, SopStageHandler>>
    >,
  ) {}

  /** 按 SOP 阶段名解析 Handler。 */
  resolve(stage: SopPipelineStage): SopStageHandler {
    const handler = this.handlers[stage];
    if (!handler) {
      throw new Error(`No SOP handler registered for stage: ${stage}`);
    }
    return handler;
  }
}
