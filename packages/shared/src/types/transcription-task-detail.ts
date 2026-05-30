import type { TranscriptionTaskSummary } from "./transcription-task-summary.js";

/**
 * 任务详情内嵌文稿摘要（不含完整正文；完整内容经 `/transcript` 获取）。
 */
export interface TranscriptSummaryEmbedded {
  readonly version: number;
  readonly summaryText: string | null;
  readonly updatedAt: string;
}

/**
 * `GET /api/transcription/tasks/:id` 详情（`tasks.md` M6-A · 工作台入口）。
 *
 * 扩展 M4 列表摘要，附加播放用 Storage 键引用（**不**返回签名直链）。
 */
export interface TranscriptionTaskDetail extends TranscriptionTaskSummary {
  readonly diarizationDegraded: boolean;
  /** 抽音后音频对象键；未完成时可能为 `null`。 */
  readonly audioStorageKey: string | null;
  readonly sourceStorageKey: string;
  readonly isMp4: boolean;
  readonly transcript: TranscriptSummaryEmbedded | null;
}
