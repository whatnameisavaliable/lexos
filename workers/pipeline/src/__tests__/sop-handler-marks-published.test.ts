import { describe, expect, it, vi } from "vitest";
import { SopMediaOcrHandler } from "../handlers/sop-media-ocr.handler.js";

describe("SOP handler marks published", () => {
  it("sets published_at via WorkerOutboxRepository", async () => {
    const markPublished = vi.fn().mockResolvedValue(undefined);
    const handler = new SopMediaOcrHandler(
      { run: vi.fn().mockResolvedValue(undefined) } as never,
      { markPublished } as never,
    );

    const client = { release: vi.fn(), query: vi.fn() };
    await handler.handle({
      pool: { connect: vi.fn().mockResolvedValue(client) } as never,
      event: { id: "evt-pub" } as never,
      payload: {
        stage: "sop.media.ocr",
        pipeline_id: "p1",
        step_code: "01-A",
      },
    });

    expect(markPublished).toHaveBeenCalledWith(client, "evt-pub");
  });
});
