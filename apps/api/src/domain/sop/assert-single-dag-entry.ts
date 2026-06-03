import { ErrorCode } from "@lexos/shared/api";
import { LexosError } from "@lexos/shared";
import type { SopStepDependsOnNode } from "./detect-depends-on-cycle.js";

/**
 * 断言 DAG 有且仅有一个入口节点（`depends_on` 为空 · `prd.md` §3.4.1 / §3.8.1）。
 *
 * @throws {LexosError} `VALIDATION_FAILED` 当入口数 ≠ 1
 */
export function assertSingleDagEntry(
  steps: readonly SopStepDependsOnNode[],
): void {
  const entries = steps.filter((step) => step.dependsOn.length === 0);

  if (entries.length !== 1) {
    throw new LexosError(
      ErrorCode.VALIDATION_FAILED,
      `SOP template must have exactly one DAG entry; found ${entries.length}`,
      { entries },
    );
  }
}
