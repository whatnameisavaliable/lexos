import { PipelineArtifactStatus } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { LexosError } from "@lexos/shared";
import type { SopStepDependsOnNode } from "./detect-depends-on-cycle.js";

/** 按 `step_code` 索引的产出物状态（缺失表示尚未创建）。 */
export type ArtifactsByStepCode = Readonly<
  Record<string, { readonly status: string } | undefined>
>;

/**
 * 断言当前步骤全部 `depends_on` 前置步骤产出物已 `finalized`。
 *
 * @param pipelineId - 用于错误详情
 * @param step - 当前步骤（含 `dependsOn`）
 * @param artifactsByCode - 同流水线各步骤产出物状态
 * @throws {LexosError} `OPERATION_NOT_ALLOWED` 当前置未定稿
 */
export function assertDependsOnFinalized(
  pipelineId: string,
  step: SopStepDependsOnNode,
  artifactsByCode: ArtifactsByStepCode,
): void {
  for (const depCode of step.dependsOn) {
    const artifact = artifactsByCode[depCode];
    if (artifact?.status !== PipelineArtifactStatus.FINALIZED) {
      throw new LexosError(
        ErrorCode.OPERATION_NOT_ALLOWED,
        `Step ${step.stepCode} requires finalized upstream step ${depCode}`,
        { pipelineId, stepCode: step.stepCode, dependsOn: depCode },
      );
    }
  }
}
