import type { TranscriptionTaskStatus } from "../enums/transcription-task-status.js";

/**
 * `GET /api/transcription/tasks` 列表行摘要（`tasks.md` M4-A · `ui_design.md` §6.3）。
 */
export interface TranscriptionTaskSummary {
  readonly id: string;
  readonly title: string;
  readonly status: TranscriptionTaskStatus;
  /** 媒体时长（秒）；上传前可能为 `null`，列表序列化为省略或 `null`。 */
  readonly durationSec: number | null;
  readonly sizeBytes: number;
  readonly createdAt: string;
}
