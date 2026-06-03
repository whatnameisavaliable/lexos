import type { PipelineArtifactStatus } from "@lexos/shared";
import { Badge } from "@/components/ui/badge";

const ARTIFACT_STATUS_LABELS: Record<PipelineArtifactStatus, string> = {
  running: "执行中",
  draft: "待审阅",
  failed: "失败",
  finalized: "已定稿",
};

/** 产出物状态中文标签。 */
export function artifactStatusLabel(status: PipelineArtifactStatus): string {
  return ARTIFACT_STATUS_LABELS[status];
}

const VARIANT_BY_STATUS: Record<
  PipelineArtifactStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  running: "secondary",
  draft: "outline",
  failed: "destructive",
  finalized: "default",
};

export interface SopArtifactStatusBadgeProps {
  readonly status: PipelineArtifactStatus;
}

/** 步骤产出物状态徽章。 */
export function SopArtifactStatusBadge({ status }: SopArtifactStatusBadgeProps) {
  return (
    <Badge variant={VARIANT_BY_STATUS[status]}>{artifactStatusLabel(status)}</Badge>
  );
}
