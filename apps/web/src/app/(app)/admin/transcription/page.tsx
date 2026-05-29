import { TranscriptionTasksPanel } from "@/components/transcription/transcription-tasks-panel";

/** 管理员 — 全量转写任务列表（RLS 返回全部 · `ui_design.md` §6.3）。 */
export default function AdminTranscriptionPage() {
  return <TranscriptionTasksPanel title="语音转写（全量）" />;
}
