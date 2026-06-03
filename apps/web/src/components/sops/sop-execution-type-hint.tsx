import { SopExecutionType, type SopExecutionType as SopExecutionTypeValue } from "@lexos/shared";

const EXECUTION_HINTS: Record<SopExecutionTypeValue, string> = {
  [SopExecutionType.SYNC_LLM]:
    "同步 LLM：单次调用，预计 ≤60 秒完成，结果立即可审阅。",
  [SopExecutionType.ASYNC_DEEP_RESEARCH]:
    "异步检索：提交后由后台深度研究，请通过轮询等待步骤进入「待审阅」。",
  [SopExecutionType.MANUAL]: "人工表单：填写结构化字段后执行，无自动 LLM 调用。",
};

/** 按执行类型返回说明文案。 */
export function executionTypeHint(type: SopExecutionTypeValue): string {
  return EXECUTION_HINTS[type];
}

export interface SopExecutionTypeHintProps {
  readonly executionType: SopExecutionTypeValue;
}

/** 步骤执行类型说明。 */
export function SopExecutionTypeHint({ executionType }: SopExecutionTypeHintProps) {
  return (
    <p className="text-muted-foreground text-sm">{executionTypeHint(executionType)}</p>
  );
}
