import { describe, expect, it, vi } from "vitest";
import { SopMediaOcrHandler } from "./sop-media-ocr.handler.js";

describe("SopMediaOcrHandler", () => {
  it("runs service and marks outbox published", async () => {
    const service = { run: vi.fn().mockResolvedValue(undefined) };
    const outboxRepository = {
      markPublished: vi.fn().mockResolvedValue(undefined),
    };
    const handler = new SopMediaOcrHandler(service as never, outboxRepository as never);
    const pool = {
      connect: vi.fn().mockResolvedValue({
        release: vi.fn(),
        query: vi.fn(),
      }),
    };

    await handler.handle({
      pool: pool as never,
      event: { id: "evt-1" } as never,
      payload: {
        stage: "sop.media.ocr",
        pipeline_id: "p1",
        step_code: "01-A",
      },
    });

    expect(service.run).toHaveBeenCalled();
    expect(outboxRepository.markPublished).toHaveBeenCalledWith(
      expect.anything(),
      "evt-1",
    );
  });
});
