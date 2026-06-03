import { getWorkerConcurrencyLimiter } from "./worker-concurrency.js";

/**
 * 在全局 Worker 槽位内执行任务（转写与 SOP 共享 `WORKER_MAX_CONCURRENCY`，`architecture.md` §3.2.6.10）。
 *
 * @param fn - 异步任务
 * @param maxConcurrency - 可选覆盖；默认读取环境配置
 */
export function runWithGlobalWorkerSlot<T>(
  fn: () => Promise<T>,
  maxConcurrency?: number,
): Promise<T> {
  return getWorkerConcurrencyLimiter(maxConcurrency)(fn);
}
