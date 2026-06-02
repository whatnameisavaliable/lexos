/**
 * `ai_invocation_logs.metadata` SOP 扩展键（`database.md` §3.10）。
 */
export interface SopAiInvocationMetadata {
  readonly pipeline_id: string;
  readonly step_code: string;
}

/**
 * 构造 SOP 调用日志 metadata（JSON 可序列化）。
 */
export function toSopAiInvocationMetadata(
  pipelineId: string,
  stepCode: string,
): SopAiInvocationMetadata {
  return { pipeline_id: pipelineId, step_code: stepCode };
}
