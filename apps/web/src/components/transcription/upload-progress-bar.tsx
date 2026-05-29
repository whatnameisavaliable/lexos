import { Progress } from "@/components/ui/progress";

export interface UploadProgressBarProps {
  readonly progress: number;
  readonly fileName?: string;
}

/** TUS 上传进度条（Shadcn `Progress` · `ui_design.md` §6.3.3）。 */
export function UploadProgressBar({
  progress,
  fileName,
}: UploadProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, progress));
  return (
    <div className="flex flex-col gap-2">
      {fileName ? (
        <p className="text-sm text-muted-foreground truncate">{fileName}</p>
      ) : null}
      <Progress value={clamped} aria-label="上传进度" />
      <p className="text-xs text-muted-foreground text-right">{clamped}%</p>
    </div>
  );
}
