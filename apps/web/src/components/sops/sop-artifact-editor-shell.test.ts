import { describe, expect, it } from "vitest";
import {
  isHtmlArtifactContentType,
  isJsonArtifactContentType,
} from "./sop-artifact-editor-shell.js";

describe("SopArtifactEditorShell branches", () => {
  it("detects html content type", () => {
    expect(isHtmlArtifactContentType("html")).toBe(true);
  });

  it("detects json content type", () => {
    expect(isJsonArtifactContentType("json")).toBe(true);
  });
});
