import type { TranscriptionTaskStatus } from "@lexos/shared";

/** 转写任务状态中文标签（`ui_design.md` §6.3.2）。 */
export const TRANSCRIPTION_STATUS_LABELS: Record<
  TranscriptionTaskStatus,
  string
> = {
  uploading: "上传中",
  queued: "排队中",
  extracting: "抽音中",
  preprocessing: "预处理中",
  asr_running: "识别中",
  llm_running: "优化中",
  completed: "已完成",
  failed: "失败",
};
