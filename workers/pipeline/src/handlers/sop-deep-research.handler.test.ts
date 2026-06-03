import { describe, expect, it, vi } from "vitest";
import { SopDeepResearchHandler } from "./sop-deep-research.handler.js";

describe("SopDeepResearchHandler", () => {
  it("wraps service with concurrency limiters", async () => {
    const service = { run: vi.fn().mockResolvedValue(undefined) };
    const outboxRepository = {
      markPublished: vi.fn().mockResolvedValue(undefined),
    };
    const handler = new SopDeepResearchHandler(
      service as never,
      outboxRepository as never,
    );

    await handler.handle({
      pool: {
        connect: vi.fn().mockResolvedValue({ release: vi.fn(), query: vi.fn() }),
      } as never,
      event: { id: "evt-dr" } as never,
      payload: {
        stage: "sop.deep_research",
        pipeline_id: "p1",
        step_code: "02-B",
        artifact_id: "a1",
      },
    });

    expect(service.run).toHaveBeenCalled();
    expect(outboxRepository.markPublished).toHaveBeenCalled();
  });
});
