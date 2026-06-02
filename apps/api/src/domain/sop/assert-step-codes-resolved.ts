import { ErrorCode } from "@lexos/shared/api";
import { LexosError } from "@lexos/shared";
import type { SopStepDependsOnNode } from "./detect-depends-on-cycle.js";

/**
 * 断言各步骤 `depends_on` 引用的 `step_code` 均存在于当前版本步骤集。
 *
 * @throws {LexosError} `VALIDATION_FAILED` 当引用缺失
 */
export function assertDependsOnReferencesExist(
  steps: readonly SopStepDependsOnNode[],
): void {
  const codes = new Set(steps.map((s) => s.stepCode));

  for (const step of steps) {
    for (const dep of step.dependsOn) {
      if (!codes.has(dep)) {
        throw new LexosError(
          ErrorCode.VALIDATION_FAILED,
          `depends_on references unknown step_code "${dep}"`,
          { stepCode: step.stepCode, missing: dep },
        );
      }
    }
  }
}
