import { describe, expect, it } from "vitest";
import { stepCodeToMustacheArtifactPrefix } from "./step-code-to-mustache-token.js";

describe("stepCodeToMustacheArtifactPrefix", () => {
  it("normalizes 01-A to artifact_01_A_", () => {
    expect(stepCodeToMustacheArtifactPrefix("01-A")).toBe("artifact_01_A_");
  });
});
