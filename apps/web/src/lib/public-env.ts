/**
 * 浏览器可读环境变量（`NEXT_PUBLIC_*`）；禁止硬编码 Storage 桶名。
 */

/**
 * TUS 直传所需的媒体桶名（须与 BFF `STORAGE_BUCKET_MEDIA` 一致）。
 * @throws 未配置 `NEXT_PUBLIC_STORAGE_BUCKET_MEDIA` 时
 */
export function getPublicMediaStorageBucket(): string {
  const value = process.env.NEXT_PUBLIC_STORAGE_BUCKET_MEDIA?.trim();
  if (!value) {
    throw new Error(
      "Missing NEXT_PUBLIC_STORAGE_BUCKET_MEDIA (must match STORAGE_BUCKET_MEDIA)",
    );
  }
  return value;
}

/**
 * 任务状态轮询间隔（毫秒）；默认 2000（`ui_design.md` §6.3.5）。
 */
export function getTaskPollIntervalMs(): number {
  const raw = process.env.NEXT_PUBLIC_TASK_POLL_INTERVAL_MS?.trim();
  if (!raw) {
    return 2000;
  }
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 2000) {
    return 2000;
  }
  return parsed;
}
