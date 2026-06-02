import { describe, expect, it } from "vitest";
import {
  ALL_WORKER_STAGES,
  PIPELINE_STAGE_ASR,
  PIPELINE_STAGE_DRIVE_ARCHIVE,
  PIPELINE_STAGE_LLM,
  PIPELINE_STAGE_MEDIA_EXTRACT,
  PIPELINE_STAGE_MEDIA_PREPROCESS,
  PIPELINE_STAGES,
  isPipelineStage,
  nextPipelineStage,
} from "./pipeline-stages.js";

describe("pipeline-stages", () => {
  it("defines five transcription stages in order", () => {
    expect(PIPELINE_STAGES).toEqual([
      PIPELINE_STAGE_MEDIA_EXTRACT,
      PIPELINE_STAGE_MEDIA_PREPROCESS,
      PIPELINE_STAGE_ASR,
      PIPELINE_STAGE_LLM,
      PIPELINE_STAGE_DRIVE_ARCHIVE,
    ]);
  });

  it("isPipelineStage narrows known values", () => {
    expect(isPipelineStage("asr")).toBe(true);
    expect(isPipelineStage("unknown")).toBe(false);
  });

  it("nextPipelineStage returns following stage or null at end", () => {
    expect(nextPipelineStage(PIPELINE_STAGE_MEDIA_EXTRACT)).toBe(
      PIPELINE_STAGE_MEDIA_PREPROCESS,
    );
    expect(nextPipelineStage(PIPELINE_STAGE_LLM)).toBe(
      PIPELINE_STAGE_DRIVE_ARCHIVE,
    );
    expect(nextPipelineStage(PIPELINE_STAGE_DRIVE_ARCHIVE)).toBeNull();
  });

  it("ALL_WORKER_STAGES includes transcription and SOP stages", () => {
    expect(ALL_WORKER_STAGES).toHaveLength(8);
    expect(ALL_WORKER_STAGES.slice(0, 5)).toEqual(PIPELINE_STAGES);
    expect(ALL_WORKER_STAGES[5]).toBe("sop.media.ocr");
    expect(ALL_WORKER_STAGES[6]).toBe("sop.deep_research");
    expect(ALL_WORKER_STAGES[7]).toBe("sop.pdf_export");
  });
});
