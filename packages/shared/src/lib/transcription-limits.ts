/**
 * 转写任务媒体限额（`database.md` §7.1 · `prd.md` §3.5.1）。
 * 与 DB 触发器及 CHECK 约束保持一致，禁止在业务代码中重复硬编码字面量。
 */

/** 单文件最大字节数（1 GiB）。 */
export const MAX_SIZE_BYTES = 1_073_741_824;

/** 单文件最大时长（秒，5 小时）。 */
export const MAX_DURATION_SEC = 18_000;

/**
 * PRD §3.5.1 支持的原始 MIME 类型（上传 init 校验用）。
 * 扩展名与 MIME 不一致时以 MIME 为准；服务端 complete 阶段仍做 Storage 对象校验。
 */
export const ALLOWED_TRANSCRIPTION_MIME_TYPES = [
  "audio/mpeg",
  "audio/mp4",
  "audio/x-m4a",
  "audio/wav",
  "audio/wave",
  "audio/x-wav",
  "video/mp4",
] as const;

/** 允许的转写源 MIME。 */
export type AllowedTranscriptionMimeType =
  (typeof ALLOWED_TRANSCRIPTION_MIME_TYPES)[number];

/**
 * 根据 MIME 判断是否为 MP4 视频分支（走 `media.extract`）。
 * @param mimeType - 客户端声明的 MIME
 */
export function isMp4SourceMime(mimeType: string): boolean {
  return mimeType.trim().toLowerCase() === "video/mp4";
}
