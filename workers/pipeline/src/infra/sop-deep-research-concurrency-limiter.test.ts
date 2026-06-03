import { describe, expect, it, afterEach } from "vitest";
import {
  getSopDeepResearchConcurrencyLimiter,
  resetSopDeepResearchConcurrencyLimiterForTests,
  runWithSopDeepResearchSlot,
} from "./sop-deep-research-concurrency-limiter.js";

describe("sop-deep-research-concurrency-limiter", () => {
  afterEach(() => {
    resetSopDeepResearchConcurrencyLimiterForTests();
  });

  it("caps concurrent tasks at configured max (2)", async () => {
    let active = 0;
    let maxActive = 0;
    const limit = getSopDeepResearchConcurrencyLimiter(2);

    const tasks = Array.from({ length: 4 }, () =>
      limit(async () => {
        active += 1;
        maxActive = Math.max(maxActive, active);
        await new Promise((resolve) => setTimeout(resolve, 30));
        active -= 1;
      }),
    );
    await Promise.all(tasks);
    expect(maxActive).toBeLessThanOrEqual(2);
  });

  it("runWithSopDeepResearchSlot delegates to limiter", async () => {
    const result = await runWithSopDeepResearchSlot(async () => "ok");
    expect(result).toBe("ok");
  });
});
