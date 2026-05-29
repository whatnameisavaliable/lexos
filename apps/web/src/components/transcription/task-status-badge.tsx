import type { TranscriptionTaskStatus } from "@lexos/shared";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TRANSCRIPTION_STATUS_LABELS } from "./task-status-labels";

type StatusTone = "muted" | "warning" | "success" | "destructive";

const STATUS_TONE: Record<TranscriptionTaskStatus, StatusTone> = {
  uploading: "muted",
  queued: "muted",
  extracting: "warning",
  preprocessing: "warning",
  asr_running: "warning",
  llm_running: "warning",
  completed: "success",
  failed: "destructive",
};

const TONE_CLASS: Record<StatusTone, string> = {
  muted: "bg-muted text-muted-foreground hover:bg-muted",
  warning: "bg-amber-500/15 text-amber-700 hover:bg-amber-500/15 dark:text-amber-400",
  success: "bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-400",
  destructive: "bg-destructive/15 text-destructive hover:bg-destructive/15",
};

/** 转写任务状态 Badge（`ui_design.md` §6.3.2）。 */
export function TaskStatusBadge({
  status,
  className,
}: {
  readonly status: TranscriptionTaskStatus;
  readonly className?: string;
}) {
  const tone = STATUS_TONE[status];
  return (
    <Badge variant="outline" className={cn(TONE_CLASS[tone], className)}>
      {TRANSCRIPTION_STATUS_LABELS[status]}
    </Badge>
  );
}
