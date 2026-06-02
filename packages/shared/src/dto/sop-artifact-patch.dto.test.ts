import { describe, expect, it } from "vitest";
import { parseSopArtifactPatchBody } from "./sop-artifact-patch.dto.js";

describe("sopArtifactPatchBodySchema", () => {
  it("allows empty contentRaw for draft clearing (PRD §3.9.3)", () => {
    const body = parseSopArtifactPatchBody({ contentRaw: "" });
    expect(body.contentRaw).toBe("");
  });

  it("parses non-empty contentRaw", () => {
    const body = parseSopArtifactPatchBody({ contentRaw: "<p>draft</p>" });
    expect(body.contentRaw).toBe("<p>draft</p>");
  });
});
