import { describe, expect, it } from "vitest";
import { isSopJsonArtifactReadOnly } from "./sop-artifact-json-viewer.js";

describe("isSopJsonArtifactReadOnly", () => {
  it("is read-only when finalized", () => {
    expect(isSopJsonArtifactReadOnly("finalized")).toBe(true);
  });

  it("is editable when draft", () => {
    expect(isSopJsonArtifactReadOnly("draft")).toBe(false);
  });
});
