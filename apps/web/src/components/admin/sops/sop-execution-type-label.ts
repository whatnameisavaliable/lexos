import { SopExecutionType, type SopExecutionType as SopExecutionTypeValue } from "@lexos/shared";

const EXECUTION_TYPE_LABELS: Record<SopExecutionTypeValue, string> = {
  [SopExecutionType.SYNC_LLM]: "同步 LLM",
  [SopExecutionType.ASYNC_DEEP_RESEARCH]: "异步深度研究",
  [SopExecutionType.MANUAL]: "人工表单",
};

/**
 * 返回 SOP 步骤执行类型的中文展示名。
 */
export function executionTypeLabel(type: SopExecutionTypeValue): string {
  return EXECUTION_TYPE_LABELS[type];
}
