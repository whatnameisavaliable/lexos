import { describe, expect, it, vi } from "vitest";
import { SopPdfExportHandler } from "./sop-pdf-export.handler.js";

describe("SopPdfExportHandler", () => {
  it("runs pdf export service", async () => {
    const service = { run: vi.fn().mockResolvedValue(undefined) };
    const outboxRepository = {
      markPublished: vi.fn().mockResolvedValue(undefined),
    };
    const handler = new SopPdfExportHandler(service as never, outboxRepository as never);

    await handler.handle({
      pool: {
        connect: vi.fn().mockResolvedValue({ release: vi.fn(), query: vi.fn() }),
      } as never,
      event: { id: "evt-pdf" } as never,
      payload: {
        stage: "sop.pdf_export",
        pipeline_id: "p1",
        step_code: "03-A",
        artifact_id: "a1",
      },
    });

    expect(service.run).toHaveBeenCalled();
    expect(outboxRepository.markPublished).toHaveBeenCalled();
  });
});
