import { loadAsrRuntimeEnvFromProcess } from "@lexos/shared/config";

/** ASR 快慢队列层级（`database.md` §3.2 `asr_queue_tier`）。 */
export type AsrQueueTier = "express" | "batch";

/**
 * 按音频时长解析 ASR 队列层级（`architecture.md` §3.2.1.2）。
 * @param durationSec - 任务时长（秒）；未知时走 `batch` 以免阻塞 express。
 * @param expressMaxDurationSec - 阈值，默认读取 `ASR_EXPRESS_MAX_DURATION_SEC`
 */
export function resolveAsrQueueTier(
  durationSec: number | null | undefined,
  expressMaxDurationSec: number = loadAsrRuntimeEnvFromProcess()
    .asrExpressMaxDurationSec,
): AsrQueueTier {
  if (durationSec == null || !Number.isFinite(durationSec)) {
    return "batch";
  }
  return durationSec <= expressMaxDurationSec ? "express" : "batch";
}
