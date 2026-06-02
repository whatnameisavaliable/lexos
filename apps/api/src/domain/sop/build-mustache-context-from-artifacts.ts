import { stepCodeToMustacheArtifactPrefix } from "@lexos/shared";

/** 已定稿产出物入参（调用方须已过滤 `finalized`）。 */
export interface FinalizedArtifactForContext {
  readonly stepCode: string;
  readonly contentRaw: string;
}

/**
 * 将已定稿产出物映射为 Mustache 上下文字典（键：`artifact_{step}_content`）。
 */
export function buildMustacheContextFromArtifacts(
  artifacts: readonly FinalizedArtifactForContext[],
): Record<string, string> {
  const context: Record<string, string> = {};
  for (const artifact of artifacts) {
    const prefix = stepCodeToMustacheArtifactPrefix(artifact.stepCode);
    context[`${prefix}content`] = artifact.contentRaw;
  }
  return context;
}
