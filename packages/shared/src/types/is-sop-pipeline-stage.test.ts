import { describe, expect, it } from "vitest";
import {
  isSopPipelineStage,
  SOP_PIPELINE_STAGES,
} from "../constants/sop-pipeline-stages.js";
import { isSopPipelineStage as reexported } from "./is-sop-pipeline-stage.js";

describe("isSopPipelineStage", () => {
  it("re-exports from sop-pipeline-stages constants", () => {
    expect(reexported).toBe(isSopPipelineStage);
  });

  it("returns true for all SOP stages", () => {
    for (const stage of SOP_PIPELINE_STAGES) {
      expect(isSopPipelineStage(stage)).toBe(true);
    }
  });

  it("returns false for transcription stages", () => {
    expect(isSopPipelineStage("media.extract")).toBe(false);
    expect(isSopPipelineStage("asr")).toBe(false);
  });
});
