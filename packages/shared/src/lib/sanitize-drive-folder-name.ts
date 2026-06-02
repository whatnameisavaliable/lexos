/** 云盘文件夹名最大长度（与 `drive_nodes.name` VARCHAR(256) 一致）。 */
export const DRIVE_FOLDER_NAME_MAX_LENGTH = 256;

/**
 * 归档/新建文件夹名：替换非法路径字符，**不截断**任务标题（PRD-3.6-01）。
 */
export function sanitizeDriveFolderName(title: string): string {
  const trimmed = title.trim();
  const sanitized = trimmed
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/\s+/g, " ");
  if (sanitized.length === 0) {
    return "untitled";
  }
  if (sanitized.length > DRIVE_FOLDER_NAME_MAX_LENGTH) {
    throw new Error(
      `folder name exceeds ${DRIVE_FOLDER_NAME_MAX_LENGTH} characters after sanitization`,
    );
  }
  return sanitized;
}
