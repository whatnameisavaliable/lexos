/**
 * `transcription_task_status` 枚举（`database.md` §1.2 · `supabase/migrations/20260529110002_enums.sql`）。
 */
export const TRANSCRIPTION_TASK_STATUS_VALUES = [
  "uploading",
  "queued",
  "extracting",
  "preprocessing",
  "asr_running",
  "llm_running",
  "completed",
  "failed",
] as const;

/** 转写任务生命周期状态。 */
export type TranscriptionTaskStatus =
  (typeof TRANSCRIPTION_TASK_STATUS_VALUES)[number];
