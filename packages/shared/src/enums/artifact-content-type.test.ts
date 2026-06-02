import { describe, expect, it } from "vitest";
import {
  ARTIFACT_CONTENT_TYPE_VALUES,
  ArtifactContentType,
  isArtifactContentType,
} from "./artifact-content-type.js";

describe("ArtifactContentType", () => {
  it("matches database enum", () => {
    expect(ARTIFACT_CONTENT_TYPE_VALUES).toEqual([
      ArtifactContentType.MARKDOWN,
      ArtifactContentType.HTML,
      ArtifactContentType.JSON,
    ]);
  });

  it("isArtifactContentType validates membership", () => {
    expect(isArtifactContentType("markdown")).toBe(true);
    expect(isArtifactContentType("html")).toBe(true);
    expect(isArtifactContentType("json")).toBe(true);
    expect(isArtifactContentType("pdf")).toBe(false);
  });
});
