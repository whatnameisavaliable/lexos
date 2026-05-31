/** 归档目录内音频文件展示名。 */
export const DRIVE_ARCHIVE_AUDIO_FILE_NAME = "录音";

/** 归档目录内转写稿展示名。 */
export const DRIVE_ARCHIVE_TRANSCRIPT_FILE_NAME = "转写稿.txt";

/**
 * 从 Storage 对象键提取文件名（含扩展名）。
 */
export function basenameFromStorageKey(storageKey: string): string {
  const normalized = storageKey.replace(/\\/g, "/");
  const parts = normalized.split("/");
  const last = parts.at(-1)?.trim();
  return last && last.length > 0 ? last : "file";
}

/**
 * 推断音频归档文件名（保留扩展名）。
 */
export function resolveArchiveAudioFileName(storageKey: string): string {
  const base = basenameFromStorageKey(storageKey);
  const dot = base.lastIndexOf(".");
  if (dot > 0) {
    const ext = base.slice(dot);
    return `${DRIVE_ARCHIVE_AUDIO_FILE_NAME}${ext}`;
  }
  return `${DRIVE_ARCHIVE_AUDIO_FILE_NAME}.mp3`;
}

/**
 * 根据扩展名推断 MIME（归档展示用）。
 */
export function guessMimeTypeFromFileName(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".mp3")) {
    return "audio/mpeg";
  }
  if (lower.endsWith(".wav")) {
    return "audio/wav";
  }
  if (lower.endsWith(".m4a")) {
    return "audio/mp4";
  }
  if (lower.endsWith(".mp4")) {
    return "video/mp4";
  }
  if (lower.endsWith(".txt")) {
    return "text/plain; charset=utf-8";
  }
  if (lower.endsWith(".pdf")) {
    return "application/pdf";
  }
  if (lower.endsWith(".docx")) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  return "application/octet-stream";
}

/**
 * 构建归档转写稿 exports 对象键（与 M6 导出路径规则一致）。
 */
export function buildArchiveTranscriptObjectKey(
  ownerId: string,
  taskId: string,
  now: Date = new Date(),
): string {
  const stamp = now.toISOString().replace(/[:.]/g, "-");
  return `${ownerId}/${taskId}/archive-transcript-${stamp}.txt`;
}
