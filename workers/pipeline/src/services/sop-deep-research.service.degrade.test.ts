import { describe, expect, it, vi } from "vitest";
import { SopDeepResearchService } from "./sop-deep-research.service.js";

describe("SopDeepResearchService.runExternalSearchOrSkip", () => {
  it("returns false when probe fails", async () => {
    const probe = vi.fn().mockResolvedValue(false);
    const service = new SopDeepResearchService(
      { sopDeepResearchTimeoutMs: 1000 },
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      probe,
    );

    await expect(service.runExternalSearchOrSkip()).resolves.toBe(false);
  });
});
