/**
 * 本地文稿 `version` 缓存（PATCH `If-Match` 与响应 ETag 同步）。
 */
const versionByTaskId = new Map<string, number>();

/** 读取任务文稿版本缓存。 */
export function getCachedTranscriptVersion(taskId: string): number | undefined {
  return versionByTaskId.get(taskId);
}

/** 写入任务文稿版本缓存。 */
export function setCachedTranscriptVersion(taskId: string, version: number): void {
  versionByTaskId.set(taskId, version);
}

/** 清除任务文稿版本缓存。 */
export function clearCachedTranscriptVersion(taskId: string): void {
  versionByTaskId.delete(taskId);
}
