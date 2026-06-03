import type { SopPipelineStepStatusItem } from "@lexos/shared";

/** 任一步骤产出物为 `running` 时强制轮询。 */
export function shouldForceSopPipelinePoll(
  steps: readonly SopPipelineStepStatusItem[],
): boolean {
  return steps.some((step) => step.artifactStatus === "running");
}

export type SopArtifactStatusTransition =
  | "running_to_draft"
  | "running_to_failed";

/** 检测步骤产出物状态从 `running` 的迁移（用于 Toast）。 */
export function detectSopArtifactStatusTransitions(
  previous: readonly SopPipelineStepStatusItem[],
  current: readonly SopPipelineStepStatusItem[],
): readonly { readonly stepCode: string; readonly transition: SopArtifactStatusTransition }[] {
  const out: { stepCode: string; transition: SopArtifactStatusTransition }[] = [];
  for (const step of current) {
    const prev = previous.find((s) => s.stepCode === step.stepCode);
    if (prev?.artifactStatus !== "running") {
      continue;
    }
    if (step.artifactStatus === "draft") {
      out.push({ stepCode: step.stepCode, transition: "running_to_draft" });
    } else if (step.artifactStatus === "failed") {
      out.push({ stepCode: step.stepCode, transition: "running_to_failed" });
    }
  }
  return out;
}

/** 状态迁移 Toast 文案（`prd.md` §4.2.4 SOP L3）。 */
export function sopArtifactTransitionToastMessage(
  transition: SopArtifactStatusTransition,
  stepName?: string,
): string {
  if (transition === "running_to_draft") {
    return "步骤已完成，请审阅定稿";
  }
  return stepName
    ? `步骤执行失败：${stepName}`
    : "步骤执行失败，请查看步骤详情";
}

/** 律师端流水线工作区路径。 */
export function lawyerSopPipelinePath(pipelineId: string): string {
  return `/sops/pipelines/${encodeURIComponent(pipelineId)}`;
}
