import { describe, expect, it, afterEach } from "vitest";
import { resetWorkerConcurrencyLimiterForTests } from "./worker-concurrency.js";
import { runWithGlobalWorkerSlot } from "./sop-worker-concurrency-guard.js";

describe("sop-worker-concurrency-guard", () => {
  afterEach(() => {
    resetWorkerConcurrencyLimiterForTests();
  });

  it("shares global worker concurrency with transcription tasks", async () => {
    let active = 0;
    let maxActive = 0;

    await Promise.all(
      Array.from({ length: 6 }, () =>
        runWithGlobalWorkerSlot(async () => {
          active += 1;
          maxActive = Math.max(maxActive, active);
          await new Promise((resolve) => setTimeout(resolve, 30));
          active -= 1;
        }, 5),
      ),
    );

    expect(maxActive).toBeLessThanOrEqual(5);
  });
});
