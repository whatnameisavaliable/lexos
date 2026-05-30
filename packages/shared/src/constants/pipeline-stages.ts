/**
 * U3 流水线逻辑阶段名（`architecture.md` §3.2.1.3 · `database.md` v1.4 §3.14）。
 */
export const PIPELINE_STAGE_MEDIA_EXTRACT = "media.extract" as const;
export const PIPELINE_STAGE_MEDIA_PREPROCESS = "media.preprocess" as const;
export const PIPELINE_STAGE_ASR = "asr" as const;
export const PIPELINE_STAGE_LLM = "llm" as const;
export const PIPELINE_STAGE_DRIVE_ARCHIVE = "drive.archive" as const;

/** 五阶段完整顺序（Outbox `payload.stage` 与 `pipeline_job_runs.stage`）。 */
export const PIPELINE_STAGES = [
  PIPELINE_STAGE_MEDIA_EXTRACT,
  PIPELINE_STAGE_MEDIA_PREPROCESS,
  PIPELINE_STAGE_ASR,
  PIPELINE_STAGE_LLM,
  PIPELINE_STAGE_DRIVE_ARCHIVE,
] as const;

/** 流水线阶段字面量联合类型。 */
export type PipelineStage = (typeof PIPELINE_STAGES)[number];

/** 判断字符串是否为已知流水线阶段。 */
export function isPipelineStage(value: string): value is PipelineStage {
  return (PIPELINE_STAGES as readonly string[]).includes(value);
}

/**
 * 返回 `stage` 的下一阶段；末阶段返回 `null`。
 */
export function nextPipelineStage(stage: PipelineStage): PipelineStage | null {
  const index = PIPELINE_STAGES.indexOf(stage);
  if (index < 0 || index >= PIPELINE_STAGES.length - 1) {
    return null;
  }
  return PIPELINE_STAGES[index + 1] ?? null;
}
