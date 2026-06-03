import pLimit, { type LimitFunction } from "p-limit";
import { loadSopWorkerRuntimeEnvFromProcess } from "@lexos/shared/config";

/** 单例缓存（进程内共享）。 */
let cachedLimiter: LimitFunction | null = null;
let cachedMax = 0;

/**
 * 获取 SOP PDF 导出并发限制器（`SOP_PDF_MAX_CONCURRENT`，默认 1）。
 */
export function getSopPdfConcurrencyLimiter(
  maxConcurrent?: number,
): LimitFunction {
  const resolved =
    maxConcurrent ??
    loadSopWorkerRuntimeEnvFromProcess().sopPdfMaxConcurrent;
  if (!Number.isFinite(resolved) || resolved <= 0) {
    throw new Error("SOP_PDF_MAX_CONCURRENT must be a positive integer");
  }
  if (!cachedLimiter || cachedMax !== resolved) {
    cachedLimiter = pLimit(resolved);
    cachedMax = resolved;
  }
  return cachedLimiter;
}

/**
 * 在 PDF 导出槽位内执行异步任务（`architecture.md` §3.2.6.3）。
 */
export function runWithSopPdfSlot<T>(fn: () => Promise<T>): Promise<T> {
  return getSopPdfConcurrencyLimiter()(fn);
}

/** 测试专用：重置单例。 */
export function resetSopPdfConcurrencyLimiterForTests(): void {
  cachedLimiter = null;
  cachedMax = 0;
}
