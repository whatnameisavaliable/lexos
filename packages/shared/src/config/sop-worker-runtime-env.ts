/** SOP Worker 分 stage 限流运行时配置（`architecture.md` §3.2.6.3、§3.2.6.9）。 */
export interface SopWorkerRuntimeEnvConfig {
  /** PDF 导出最大并发；默认 1。 */
  readonly sopPdfMaxConcurrent: number;
  /** Deep Research 最大并发；默认 2。 */
  readonly sopDeepResearchMaxConcurrent: number;
  /** Deep Research 超时（毫秒）；默认 1_800_000（30min）。 */
  readonly sopDeepResearchTimeoutMs: number;
}

const DEFAULT_SOP_PDF_MAX_CONCURRENT = 1;
const DEFAULT_SOP_DEEP_RESEARCH_MAX_CONCURRENT = 2;
const DEFAULT_SOP_DEEP_RESEARCH_TIMEOUT_MS = 1_800_000;

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  if (!raw?.trim()) {
    return fallback;
  }
  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`Invalid positive integer: ${raw}`);
  }
  return value;
}

/**
 * 从 `process.env` 解析 SOP Worker 限额（禁止硬编码生产阈值）。
 */
export function loadSopWorkerRuntimeEnvFromProcess(): SopWorkerRuntimeEnvConfig {
  return {
    sopPdfMaxConcurrent: parsePositiveInt(
      process.env.SOP_PDF_MAX_CONCURRENT,
      DEFAULT_SOP_PDF_MAX_CONCURRENT,
    ),
    sopDeepResearchMaxConcurrent: parsePositiveInt(
      process.env.SOP_DEEP_RESEARCH_MAX_CONCURRENT,
      DEFAULT_SOP_DEEP_RESEARCH_MAX_CONCURRENT,
    ),
    sopDeepResearchTimeoutMs: parsePositiveInt(
      process.env.SOP_DEEP_RESEARCH_TIMEOUT_MS,
      DEFAULT_SOP_DEEP_RESEARCH_TIMEOUT_MS,
    ),
  };
}
