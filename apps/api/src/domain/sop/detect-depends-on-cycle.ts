/** DAG 校验用的最小步骤形状。 */
export interface SopStepDependsOnNode {
  readonly stepCode: string;
  readonly dependsOn: readonly string[];
}

/**
 * 检测 `depends_on` 有向图中的环；若存在环则返回环上某一 `step_code`，否则 `null`。
 */
export function detectDependsOnCycle(
  steps: readonly SopStepDependsOnNode[],
): string | null {
  const adjacency = new Map<string, string[]>();
  for (const step of steps) {
    adjacency.set(step.stepCode, [...step.dependsOn]);
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();

  const dfs = (node: string): string | null => {
    if (visited.has(node)) {
      return null;
    }
    if (visiting.has(node)) {
      return node;
    }
    visiting.add(node);
    for (const dep of adjacency.get(node) ?? []) {
      const cycleNode = dfs(dep);
      if (cycleNode) {
        return cycleNode;
      }
    }
    visiting.delete(node);
    visited.add(node);
    return null;
  };

  for (const step of steps) {
    const cycleNode = dfs(step.stepCode);
    if (cycleNode) {
      return cycleNode;
    }
  }

  return null;
}
