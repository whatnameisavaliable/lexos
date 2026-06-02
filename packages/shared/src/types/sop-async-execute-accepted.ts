/**
 * `async_deep_research` 步骤 `execute` 的 **202 Accepted** 响应 `data`
 *（`architecture.md` §3.2.6.6 · `prd.md` §3.8.3）。
 */
export interface SopAsyncExecuteAccepted {
  readonly pipelineId: string;
  readonly stepCode: string;
  readonly artifactId: string;
}
