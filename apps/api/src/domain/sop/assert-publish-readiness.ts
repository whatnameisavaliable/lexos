import {
  assertMustacheSlotsCoveredByDependsOn,
  extractMustacheSlotNames,
  SopExecutionType,
} from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { LexosError } from "@lexos/shared";
import { assertDependsOnReferencesExist } from "./assert-step-codes-resolved.js";
import { assertSingleDagEntry } from "./assert-single-dag-entry.js";
import { detectDependsOnCycle } from "./detect-depends-on-cycle.js";
import type { SopStepDependsOnNode } from "./detect-depends-on-cycle.js";

/** 发布校验用的步骤字段。 */
export interface SopStepPublishNode extends SopStepDependsOnNode {
  readonly executionType: string;
  readonly aiFeatureKey: string | null;
  readonly promptTemplateId: string | null;
}

/**
 * 发布前综合校验：DAG、AI 映射、Prompt 绑定、Mustache 插槽 ⊆ `depends_on`。
 *
 * @param steps - 待发布版本步骤
 * @param promptsByStep - `step_code` → Prompt 正文（用于 Mustache 插槽提取）
 * @param mappingsExist - 判断 `ai_feature_key` 是否已配置模型映射
 * @throws {LexosError} `VALIDATION_FAILED` 或 DAG 相关错误
 */
export function assertPublishReadiness(
  steps: readonly SopStepPublishNode[],
  promptsByStep: Readonly<Record<string, string>>,
  mappingsExist: (featureKey: string) => boolean,
): void {
  const cycleNode = detectDependsOnCycle(steps);
  if (cycleNode) {
    throw new LexosError(
      ErrorCode.VALIDATION_FAILED,
      `depends_on cycle detected at step "${cycleNode}"`,
    );
  }

  assertDependsOnReferencesExist(steps);
  assertSingleDagEntry(steps);

  for (const step of steps) {
    const needsAi =
      step.executionType === SopExecutionType.SYNC_LLM ||
      step.executionType === SopExecutionType.ASYNC_DEEP_RESEARCH;

    if (!needsAi) {
      continue;
    }

    if (!step.promptTemplateId) {
      throw new LexosError(
        ErrorCode.VALIDATION_FAILED,
        `Step "${step.stepCode}" requires prompt_template_id`,
      );
    }

    if (!step.aiFeatureKey) {
      throw new LexosError(
        ErrorCode.VALIDATION_FAILED,
        `Step "${step.stepCode}" requires ai_feature_key`,
      );
    }

    if (!mappingsExist(step.aiFeatureKey)) {
      throw new LexosError(
        ErrorCode.VALIDATION_FAILED,
        `No AI model mapping for feature "${step.aiFeatureKey}"`,
      );
    }

    const promptBody = promptsByStep[step.stepCode] ?? "";
    const slots = extractMustacheSlotNames(promptBody);
    assertMustacheSlotsCoveredByDependsOn(slots, step.dependsOn);
  }
}
