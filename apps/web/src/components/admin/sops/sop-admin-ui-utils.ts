import { SopExecutionType, type SopExecutionType as SopExecutionTypeValue } from "@lexos/shared";

/** 是否展示 AI 相关字段。 */
export function shouldShowAiFields(executionType: SopExecutionTypeValue): boolean {
  return (
    executionType === SopExecutionType.SYNC_LLM ||
    executionType === SopExecutionType.ASYNC_DEEP_RESEARCH
  );
}

/** 发布失败 Toast 文案（422 校验错误友好化）。 */
export function formatPublishError(message: string, code?: string): string {
  if (code === "OPERATION_NOT_ALLOWED" || code === "VALIDATION_FAILED") {
    return `发布校验未通过：${message}`;
  }
  return message;
}

/** 预览结果渲染方式：纯 pre 文本。 */
export function renderPreviewResult(content: string): { tag: string; text: string } {
  return { tag: "pre", text: content };
}

/** 加载失败时是否应 Toast。 */
export function shouldToastLoadError(message: string | null): boolean {
  return Boolean(message);
}
