import { describe, expect, it, afterEach } from "vitest";
import {
  createWorkerConcurrencyLimiter,
  getWorkerConcurrencyLimiter,
  resetWorkerConcurrencyLimiterForTests,
} from "./worker-concurrency.js";

describe("worker-concurrency", () => {
  afterEach(() => {
    resetWorkerConcurrencyLimiterForTests();
  });

  it("defaults to concurrency 5", async () => {
    let active = 0;
    let maxActive = 0;
    const limit = createWorkerConcurrencyLimiter();

    const tasks = Array.from({ length: 10 }, () =>
      limit(async () => {
        active += 1;
        maxActive = Math.max(maxActive, active);
        await new Promise((resolve) => setTimeout(resolve, 20));
        active -= 1;
      }),
    );
    await Promise.all(tasks);
    expect(maxActive).toBeLessThanOrEqual(5);
  });

  it("rejects invalid concurrency", () => {
    expect(() => createWorkerConcurrencyLimiter(0)).toThrow(
      /WORKER_MAX_CONCURRENCY/,
    );
  });

  it("getWorkerConcurrencyLimiter returns singleton for same max", () => {
    const a = getWorkerConcurrencyLimiter(3);
    const b = getWorkerConcurrencyLimiter(3);
    expect(a).toBe(b);
  });
});
