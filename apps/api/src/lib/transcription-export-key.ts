import { sanitizeUploadFileName } from "../lib/transcription-storage-key.js";

/** 构建导出对象键：`{ownerId}/{taskId}/export-{timestamp}.{ext}`。 */
export function buildExportObjectKey(
  ownerId: string,
  taskId: string,
  extension: string,
  now: Date = new Date(),
): string {
  const stamp = now.toISOString().replace(/[:.]/g, "-");
  const fileName = sanitizeUploadFileName(`export-${stamp}.${extension}`);
  return `${ownerId}/${taskId}/${fileName}`;
}

/** 导出 MIME 类型映射。 */
export const EXPORT_CONTENT_TYPES = {
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pdf: "application/pdf",
  txt: "text/plain; charset=utf-8",
} as const;

export type ExportContentTypeKey = keyof typeof EXPORT_CONTENT_TYPES;
