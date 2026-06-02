import { describe, expect, it } from "vitest";
import {
  CASE_PIPELINE_STATUS_VALUES,
  CasePipelineStatus,
  isCasePipelineStatus,
} from "./case-pipeline-status.js";

describe("CasePipelineStatus", () => {
  it("matches database enum", () => {
    expect(CASE_PIPELINE_STATUS_VALUES).toEqual([
      CasePipelineStatus.IN_PROGRESS,
      CasePipelineStatus.COMPLETED,
      CasePipelineStatus.SUSPENDED,
    ]);
  });

  it("isCasePipelineStatus validates membership", () => {
    expect(isCasePipelineStatus("in_progress")).toBe(true);
    expect(isCasePipelineStatus("completed")).toBe(true);
    expect(isCasePipelineStatus("suspended")).toBe(true);
    expect(isCasePipelineStatus("archived")).toBe(false);
  });
});
