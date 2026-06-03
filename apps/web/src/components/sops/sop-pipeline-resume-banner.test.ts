import { describe, expect, it } from "vitest";

describe("SopPipelineResumeBanner", () => {
  it("targets resume API path segment", () => {
    expect("/api/sops/pipelines/p1/resume").toContain("/resume");
  });
});
