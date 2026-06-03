import type { CasePipelineStatus } from "@lexos/shared";

const PIPELINE_STATUS_LABELS: Record<CasePipelineStatus, string> = {
  in_progress: "进行中",
  completed: "已结案",
  suspended: "已挂起",
};

/** 流水线状态中文标签。 */
export function pipelineStatusLabel(status: CasePipelineStatus): string {
  return PIPELINE_STATUS_LABELS[status];
}
