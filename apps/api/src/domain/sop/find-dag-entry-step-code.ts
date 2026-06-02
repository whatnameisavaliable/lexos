import type { SopStepDependsOnNode } from "./detect-depends-on-cycle.js";

/**
 * 返回 DAG 中唯一入度为 0 的入口步骤 `step_code`（`depends_on` 为空 · `prd.md` §3.8.1）。
 */
export function findDagEntryStepCode(
  steps: readonly SopStepDependsOnNode[],
): string {
  const entries = steps.filter((s) => s.dependsOn.length === 0);

  if (entries.length !== 1) {
    throw new Error(
      `Expected exactly one DAG entry step; found ${entries.length}`,
    );
  }

  return entries[0]!.stepCode;
}
