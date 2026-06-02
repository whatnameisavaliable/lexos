import { describe, expect, it } from "vitest";
import { isSopPromptContext } from "./sop-prompt-context.js";

describe("isSopPromptContext", () => {
  it("accepts minimal valid shape", () => {
    expect(
      isSopPromptContext({
        finalizedArtifacts: [],
        formValues: {},
        sopMediaExtractedText: "",
      }),
    ).toBe(true);
  });

  it("rejects null", () => {
    expect(isSopPromptContext(null)).toBe(false);
  });
});
