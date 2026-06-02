import { TranscriptWorkbenchShell } from "@/components/transcription/workbench/transcript-workbench-shell";



/** 转写工作台路由（律师 / 管理员 · `ui_design.md` §4.3）。 */

export default async function TranscriptionTaskPage({

  params,

}: {

  params: Promise<{ taskId: string }>;

}) {

  const { taskId } = await params;

  return <TranscriptWorkbenchShell taskId={taskId} />;

}

