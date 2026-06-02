/**
 * `sop_execution_type` 枚举（`database.md` §3.16.3 · M10 迁移 `enums_sop`）。
 */
export const SopExecutionType = {
  SYNC_LLM: "sync_llm",
  ASYNC_DEEP_RESEARCH: "async_deep_research",
  MANUAL: "manual",
} as const;

/** SOP 步骤执行类型。 */
export type SopExecutionType =
  (typeof SopExecutionType)[keyof typeof SopExecutionType];

/** 全部合法 `sop_execution_type` 字面量。 */
export const SOP_EXECUTION_TYPE_VALUES: readonly SopExecutionType[] =
  Object.values(SopExecutionType);

/**
 * 判断字符串是否为合法 {@link SopExecutionType}。
 */
export function isSopExecutionType(value: string): value is SopExecutionType {
  return SOP_EXECUTION_TYPE_VALUES.includes(value as SopExecutionType);
}
