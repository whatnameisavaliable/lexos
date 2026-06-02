import type { AdminSopStepUpsert } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { LexosError } from "@lexos/shared";
import { assertDependsOnReferencesExist } from "./assert-step-codes-resolved.js";
import { assertSingleDagEntry } from "./assert-single-dag-entry.js";
import { detectDependsOnCycle } from "./detect-depends-on-cycle.js";

/**
 * 校验步骤 DAG：无环、单入口、依赖引用存在。
 *
 * @throws {LexosError} `VALIDATION_FAILED`
 */
export function validateSopStepsDag(steps: readonly AdminSopStepUpsert[]): void {
  const nodes = steps.map((step) => ({
    stepCode: step.stepCode,
    dependsOn: step.dependsOn,
  }));

  const cycleNode = detectDependsOnCycle(nodes);
  if (cycleNode) {
    throw new LexosError(
      ErrorCode.VALIDATION_FAILED,
      `depends_on cycle detected at step "${cycleNode}"`,
    );
  }

  assertDependsOnReferencesExist(nodes);
  assertSingleDagEntry(nodes);
}
