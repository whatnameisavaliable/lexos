import { withPgClient } from "../infra/with-pg-client.js";
import { runWithGlobalWorkerSlot } from "../infra/sop-worker-concurrency-guard.js";
import { WorkerOutboxRepository } from "../repositories/worker-outbox.repository.js";
import type { SopStageHandler, SopStageHandlerContext } from "./sop-stage-handler.js";
import type { SopMediaOcrService } from "../services/sop-media-ocr.service.js";

/** `sop.media.ocr` Outbox Handler。 */
export class SopMediaOcrHandler implements SopStageHandler {
  constructor(
    private readonly service: SopMediaOcrService,
    private readonly outboxRepository = new WorkerOutboxRepository(),
  ) {}

  async handle(context: SopStageHandlerContext): Promise<void> {
    await runWithGlobalWorkerSlot(async () => {
      await this.service.run(context.pool, context.payload);
      await withPgClient(context.pool, (client) =>
        this.outboxRepository.markPublished(client, context.event.id),
      );
    });
  }
}
