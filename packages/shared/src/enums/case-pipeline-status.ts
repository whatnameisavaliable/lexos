/**
 * `case_pipeline_status` 枚举（`database.md` §3.16.4）。
 */
export const CasePipelineStatus = {
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  SUSPENDED: "suspended",
} as const;

/** 案件流水线状态。 */
export type CasePipelineStatus =
  (typeof CasePipelineStatus)[keyof typeof CasePipelineStatus];

/** 全部合法 `case_pipeline_status` 字面量。 */
export const CASE_PIPELINE_STATUS_VALUES: readonly CasePipelineStatus[] =
  Object.values(CasePipelineStatus);

/**
 * 判断字符串是否为合法 {@link CasePipelineStatus}。
 */
export function isCasePipelineStatus(
  value: string,
): value is CasePipelineStatus {
  return CASE_PIPELINE_STATUS_VALUES.includes(value as CasePipelineStatus);
}
