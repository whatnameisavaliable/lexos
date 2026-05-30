/** 进程内令牌桶 ASR 限流器（`architecture.md` §3.2.1.6 · `ASR_RATE_LIMIT_MAX`/60s）。 */
export class AsrRateLimiter {
  private tokens: number;
  private lastRefillMs: number;
  private readonly windowMs = 60_000;

  /**
   * @param maxPerMinute - 每分钟最大 ASR 调用次数（`ASR_RATE_LIMIT_MAX`）
   */
  constructor(private readonly maxPerMinute: number) {
    if (!Number.isFinite(maxPerMinute) || maxPerMinute <= 0) {
      throw new Error("ASR_RATE_LIMIT_MAX must be a positive integer");
    }
    this.tokens = maxPerMinute;
    this.lastRefillMs = Date.now();
  }

  /** 当前可用令牌数（测试/观测用）。 */
  getAvailableTokens(now: () => number = Date.now): number {
    this.refill(now());
    return this.tokens;
  }

  /**
   * 获取一次 ASR 调用许可；令牌不足时等待至窗口内有余量。
   */
  async acquire(now: () => number = Date.now): Promise<void> {
    while (true) {
      const currentMs = now();
      this.refill(currentMs);
      if (this.tokens >= 1) {
        this.tokens -= 1;
        return;
      }
      const elapsed = currentMs - this.lastRefillMs;
      const waitMs = Math.max(1, this.windowMs - elapsed);
      await sleep(waitMs);
    }
  }

  private refill(nowMs: number): void {
    const elapsed = nowMs - this.lastRefillMs;
    if (elapsed <= 0) {
      return;
    }
    const tokensToAdd = (elapsed / this.windowMs) * this.maxPerMinute;
    this.tokens = Math.min(this.maxPerMinute, this.tokens + tokensToAdd);
    this.lastRefillMs = nowMs;
  }
}

/**
 * 创建 ASR 限流器实例。
 */
export function createAsrRateLimiter(maxPerMinute: number): AsrRateLimiter {
  return new AsrRateLimiter(maxPerMinute);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
