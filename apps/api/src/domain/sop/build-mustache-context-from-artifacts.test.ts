import { describe, expect, it } from "vitest";
import { buildMustacheContextFromArtifacts } from "./build-mustache-context-from-artifacts.js";

describe("buildMustacheContextFromArtifacts", () => {
  it("maps finalized artifacts to artifact_*_content keys", () => {
    const context = buildMustacheContextFromArtifacts([
      { stepCode: "01-A", contentRaw: "facts" },
    ]);
    expect(context.artifact_01_A_content).toBe("facts");
  });
});
