import { describe, expect, it } from "vitest";
import {
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
  it("defines five stages in order", () => {
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
});
