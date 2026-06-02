/** 已定稿上游产出物（调用方须已过滤为 finalized）。 */
export interface SopFinalizedArtifactInput {
  readonly stepCode: string;
  readonly contentRaw: string;
}

/**
 * SOP Prompt 组装上下文（`prd.md` §3.8 · 卷宗 OCR + 表单 + 上游定稿）。
 */
export interface SopPromptContext {
  readonly finalizedArtifacts: readonly SopFinalizedArtifactInput[];
  readonly formValues: Readonly<Record<string, string>>;
  readonly sopMediaExtractedText: string;
}

/**
 * 最小字段类型守卫（用于边界校验与测试）。
 */
export function isSopPromptContext(value: unknown): value is SopPromptContext {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const v = value as SopPromptContext;
  return (
    Array.isArray(v.finalizedArtifacts) &&
    typeof v.formValues === "object" &&
    v.formValues !== null &&
    typeof v.sopMediaExtractedText === "string"
  );
}
