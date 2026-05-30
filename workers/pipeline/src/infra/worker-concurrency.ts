import pLimit, { type LimitFunction } from "p-limit";

const DEFAULT_WORKER_MAX_CONCURRENCY = 5;

/**
 * 全局转写任务并发限制器（`architecture.md` §3.2.1.5 · `WORKER_MAX_CONCURRENCY`）。
 *
 * @param maxConcurrency - 同时处理的 `task_id` 数；默认 5
 */
export function createWorkerConcurrencyLimiter(
  maxConcurrency: number = DEFAULT_WORKER_MAX_CONCURRENCY,
): LimitFunction {
  if (!Number.isFinite(maxConcurrency) || maxConcurrency <= 0) {
    throw new Error("WORKER_MAX_CONCURRENCY must be a positive integer");
  }
  return pLimit(maxConcurrency);
}

/** 单例缓存（进程内共享）。 */
let cachedLimiter: LimitFunction | null = null;
let cachedMax = 0;

/**
 * 获取进程内共享 Worker 并发限制器。
 */
export function getWorkerConcurrencyLimiter(
  maxConcurrency: number = DEFAULT_WORKER_MAX_CONCURRENCY,
): LimitFunction {
  if (!cachedLimiter || cachedMax !== maxConcurrency) {
    cachedLimiter = createWorkerConcurrencyLimiter(maxConcurrency);
    cachedMax = maxConcurrency;
  }
  return cachedLimiter;
}

/** 测试专用：重置单例。 */
export function resetWorkerConcurrencyLimiterForTests(): void {
  cachedLimiter = null;
  cachedMax = 0;
}
