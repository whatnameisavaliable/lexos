import { describe, expect, it } from "vitest";
import {
  PIPELINE_ARTIFACT_STATUS_VALUES,
  PipelineArtifactStatus,
  isPipelineArtifactStatus,
} from "./pipeline-artifact-status.js";

describe("PipelineArtifactStatus", () => {
  it("defines four lifecycle states", () => {
    expect(PIPELINE_ARTIFACT_STATUS_VALUES).toEqual([
      PipelineArtifactStatus.RUNNING,
      PipelineArtifactStatus.DRAFT,
      PipelineArtifactStatus.FAILED,
      PipelineArtifactStatus.FINALIZED,
    ]);
  });

  it("isPipelineArtifactStatus rejects unknown values", () => {
    expect(isPipelineArtifactStatus("running")).toBe(true);
    expect(isPipelineArtifactStatus("draft")).toBe(true);
    expect(isPipelineArtifactStatus("failed")).toBe(true);
    expect(isPipelineArtifactStatus("finalized")).toBe(true);
    expect(isPipelineArtifactStatus("pending")).toBe(false);
  });
});
