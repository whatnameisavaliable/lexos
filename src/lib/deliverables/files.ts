export const DELIVERABLE_BUCKET = "lexos-deliverables";
export const MAX_DELIVERABLE_FILE_BYTES = 6 * 1024 * 1024;
export const SIGNED_DELIVERABLE_URL_SECONDS = 5 * 60;

export const ALLOWED_DELIVERABLE_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/png",
  "image/jpeg",
  "application/zip",
  "application/x-zip-compressed",
]);

const fallbackMimeTypesByExtension: Record<string, string> = {
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  pdf: "application/pdf",
  png: "image/png",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  zip: "application/zip",
};

export type DeliverableFileLike = {
  name: string;
  size: number;
  type?: string;
};

export type DeliverableStoragePathInput = {
  fileName: string;
  organizationId: string;
  taskId: string;
  uniqueId?: string;
};

export function sanitizeDeliverableFileName(fileName: string): string {
  const trimmed = fileName.trim().replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, " ");
  const normalized = trimmed.replace(/^\.+/, "").slice(0, 120);

  return normalized || "deliverable-file";
}

export function detectDeliverableMimeType(file: DeliverableFileLike): string {
  if (file.type && ALLOWED_DELIVERABLE_MIME_TYPES.has(file.type)) {
    return file.type;
  }

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  return fallbackMimeTypesByExtension[extension] ?? file.type ?? "application/octet-stream";
}

export function validateDeliverableUpload(file: DeliverableFileLike): void {
  if (!file.name.trim()) {
    throw new Error("请选择有效的交付附件");
  }

  if (file.size <= 0) {
    throw new Error("交付附件不能为空文件");
  }

  if (file.size > MAX_DELIVERABLE_FILE_BYTES) {
    throw new Error("交付附件不能超过 6MB");
  }

  if (!ALLOWED_DELIVERABLE_MIME_TYPES.has(detectDeliverableMimeType(file))) {
    throw new Error("仅支持 PDF、Word、Excel、图片或 ZIP 附件");
  }
}

export function buildDeliverableStoragePath(input: DeliverableStoragePathInput): string {
  const safeFileName = sanitizeDeliverableFileName(input.fileName);
  const uniqueId = input.uniqueId ?? crypto.randomUUID();

  return [input.organizationId, input.taskId, `${uniqueId}-${safeFileName}`].join("/");
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
