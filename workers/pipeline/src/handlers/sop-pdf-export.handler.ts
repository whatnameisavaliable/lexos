import { withPgClient } from "../infra/with-pg-client.js";
import { runWithGlobalWorkerSlot } from "../infra/sop-worker-concurrency-guard.js";
import { runWithSopPdfSlot } from "../infra/sop-pdf-concurrency-limiter.js";
import { WorkerOutboxRepository } from "../repositories/worker-outbox.repository.js";
import type { SopStageHandler, SopStageHandlerContext } from "./sop-stage-handler.js";
import type { SopPdfExportService } from "../services/sop-pdf-export.service.js";

/** `sop.pdf_export` Outbox Handler（全局 + PDF 分 stage 限流）。 */
export class SopPdfExportHandler implements SopStageHandler {
  constructor(
    private readonly service: SopPdfExportService,
    private readonly outboxRepository = new WorkerOutboxRepository(),
  ) {}

  async handle(context: SopStageHandlerContext): Promise<void> {
    await runWithGlobalWorkerSlot(() =>
      runWithSopPdfSlot(async () => {
        await this.service.run(context.pool, context.payload);
        await withPgClient(context.pool, (client) =>
          this.outboxRepository.markPublished(client, context.event.id),
        );
      }),
    );
  }
}
