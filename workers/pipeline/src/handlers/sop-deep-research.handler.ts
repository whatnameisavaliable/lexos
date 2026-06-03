import { withPgClient } from "../infra/with-pg-client.js";
import { runWithGlobalWorkerSlot } from "../infra/sop-worker-concurrency-guard.js";
import { runWithSopDeepResearchSlot } from "../infra/sop-deep-research-concurrency-limiter.js";
import { WorkerOutboxRepository } from "../repositories/worker-outbox.repository.js";
import type { SopStageHandler, SopStageHandlerContext } from "./sop-stage-handler.js";
import type { SopDeepResearchService } from "../services/sop-deep-research.service.js";

/** `sop.deep_research` Outbox Handler（全局 + DR 分 stage 限流）。 */
export class SopDeepResearchHandler implements SopStageHandler {
  constructor(
    private readonly service: SopDeepResearchService,
    private readonly outboxRepository = new WorkerOutboxRepository(),
  ) {}

  async handle(context: SopStageHandlerContext): Promise<void> {
    await runWithGlobalWorkerSlot(() =>
      runWithSopDeepResearchSlot(async () => {
        await this.service.run(context.pool, context.payload);
        await withPgClient(context.pool, (client) =>
          this.outboxRepository.markPublished(client, context.event.id),
        );
      }),
    );
  }
}
