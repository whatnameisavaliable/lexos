/**
 * 将 `step_code` 规范化为 Mustache 插槽前缀（`prd.md` §2.4：`artifact_{step_code}_*`）。
 *
 * @example
 * stepCodeToMustacheArtifactPrefix("01-A") // "artifact_01_A_"
 */
export function stepCodeToMustacheArtifactPrefix(stepCode: string): string {
  const normalized = stepCode.replace(/[^a-zA-Z0-9]/g, "_");
  return `artifact_${normalized}_`;
}
