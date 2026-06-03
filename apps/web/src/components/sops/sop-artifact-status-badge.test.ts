import { describe, expect, it } from "vitest";
import { artifactStatusLabel } from "./sop-artifact-status-badge.js";

describe("artifactStatusLabel", () => {
  it("returns 执行中 for running", () => {
    expect(artifactStatusLabel("running")).toBe("执行中");
  });

  it("returns 已定稿 for finalized", () => {
    expect(artifactStatusLabel("finalized")).toBe("已定稿");
  });
});
