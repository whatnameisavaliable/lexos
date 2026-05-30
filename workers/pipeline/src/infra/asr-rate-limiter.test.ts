import { describe, expect, it, vi, afterEach } from "vitest";
import { AsrRateLimiter, createAsrRateLimiter } from "./asr-rate-limiter.js";

describe("AsrRateLimiter", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows up to maxPerMinute acquisitions without waiting initially", async () => {
    const limiter = createAsrRateLimiter(3);
    await limiter.acquire(() => 0);
    await limiter.acquire(() => 0);
    await limiter.acquire(() => 0);
    expect(limiter.getAvailableTokens()).toBeLessThan(1);
  });

  it("refills tokens over a 60s window", async () => {
    let nowMs = 0;
    const now = () => nowMs;
    const limiter = new AsrRateLimiter(60);
    expect(limiter.getAvailableTokens(now)).toBe(60);

    await limiter.acquire(now);
    expect(limiter.getAvailableTokens(now)).toBe(59);

    nowMs += 30_000;
    expect(limiter.getAvailableTokens(now)).toBeGreaterThanOrEqual(29);
  });

  it("rejects invalid maxPerMinute", () => {
    expect(() => createAsrRateLimiter(0)).toThrow(/ASR_RATE_LIMIT_MAX/);
  });
});
