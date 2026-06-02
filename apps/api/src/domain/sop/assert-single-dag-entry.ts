import { ErrorCode } from "@lexos/shared/api";
import { LexosError } from "@lexos/shared";
import type { SopStepDependsOnNode } from "./detect-depends-on-cycle.js";

/**
 * 断言 DAG 有且仅有一个入度为 0 的入口节点（`prd.md` §3.4.1）。
 *
 * @throws {LexosError} `VALIDATION_FAILED` 当入口数 ≠ 1
 */
export function assertSingleDagEntry(
  steps: readonly SopStepDependsOnNode[],
): void {
  const referenced = new Set<string>();
  for (const step of steps) {
    for (const dep of step.dependsOn) {
      referenced.add(dep);
    }
  }

  const entries = steps
    .map((s) => s.stepCode)
    .filter((code) => !referenced.has(code));

  if (entries.length !== 1) {
    throw new LexosError(
      ErrorCode.VALIDATION_FAILED,
      `SOP template must have exactly one DAG entry; found ${entries.length}`,
      { entries },
    );
  }
}
