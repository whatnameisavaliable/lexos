import { describe, expect, it } from "vitest";
import { pipelineStatusLabel } from "./sop-pipeline-status-label.js";

describe("pipelineStatusLabel", () => {
  it("labels in_progress", () => {
    expect(pipelineStatusLabel("in_progress")).toBe("进行中");
  });

  it("labels completed", () => {
    expect(pipelineStatusLabel("completed")).toBe("已结案");
  });

  it("labels suspended", () => {
    expect(pipelineStatusLabel("suspended")).toBe("已挂起");
  });
});
