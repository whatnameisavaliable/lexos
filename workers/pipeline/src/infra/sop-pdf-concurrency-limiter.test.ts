import { describe, expect, it, afterEach } from "vitest";
import {
  getSopPdfConcurrencyLimiter,
  resetSopPdfConcurrencyLimiterForTests,
  runWithSopPdfSlot,
} from "./sop-pdf-concurrency-limiter.js";

describe("sop-pdf-concurrency-limiter", () => {
  afterEach(() => {
    resetSopPdfConcurrencyLimiterForTests();
  });

  it("allows only one concurrent task when max is 1", async () => {
    let active = 0;
    let maxActive = 0;
    const limit = getSopPdfConcurrencyLimiter(1);

    const tasks = Array.from({ length: 2 }, () =>
      limit(async () => {
        active += 1;
        maxActive = Math.max(maxActive, active);
        await new Promise((resolve) => setTimeout(resolve, 30));
        active -= 1;
      }),
    );
    await Promise.all(tasks);
    expect(maxActive).toBe(1);
  });

  it("runWithSopPdfSlot uses configured limiter", async () => {
    let concurrent = 0;
    let maxConcurrent = 0;

    await Promise.all([
      runWithSopPdfSlot(async () => {
        concurrent += 1;
        maxConcurrent = Math.max(maxConcurrent, concurrent);
        await new Promise((resolve) => setTimeout(resolve, 40));
        concurrent -= 1;
      }),
      runWithSopPdfSlot(async () => {
        concurrent += 1;
        maxConcurrent = Math.max(maxConcurrent, concurrent);
        await new Promise((resolve) => setTimeout(resolve, 40));
        concurrent -= 1;
      }),
    ]);

    expect(maxConcurrent).toBe(1);
  });
});
