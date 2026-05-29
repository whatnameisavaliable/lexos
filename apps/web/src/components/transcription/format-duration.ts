/**
 * 将秒数格式化为 `h:mm:ss` 或 `m:ss`（列表时长列）。
 */
export function formatDurationSec(durationSec: number | null): string {
  if (durationSec == null || durationSec < 0) {
    return "—";
  }
  const hours = Math.floor(durationSec / 3600);
  const minutes = Math.floor((durationSec % 3600) / 60);
  const seconds = durationSec % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
