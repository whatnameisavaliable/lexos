/**
 * 构建 Storage 前缀：`{ownerId}/{taskId}/`（`architecture.md` §5.5.1）。
 */
export function buildStorageKeyPrefix(ownerId: string, taskId: string): string {
  return `${ownerId}/${taskId}/`;
}

/**
 * 清理文件名，防止路径穿越。
 */
export function sanitizeUploadFileName(fileName: string): string {
  const normalized = fileName.replace(/\\/g, "/").split("/").pop()?.trim();
  const safe = (normalized ?? "upload").replace(/[^\w.\-()+]/g, "_");
  return safe.length > 0 ? safe : "upload";
}

/**
 * 拼接桶内对象键。
 */
export function buildObjectStorageKey(
  prefix: string,
  fileName: string,
): string {
  const normalizedPrefix = prefix.endsWith("/") ? prefix : `${prefix}/`;
  return `${normalizedPrefix}${sanitizeUploadFileName(fileName)}`;
}
