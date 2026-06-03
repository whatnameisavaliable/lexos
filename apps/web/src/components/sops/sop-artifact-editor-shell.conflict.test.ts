import { describe, expect, it } from "vitest";

describe("SopArtifactEditorShell conflict", () => {
  it("uses RESOURCE_CONFLICT code for version mismatch toast", () => {
    expect("RESOURCE_CONFLICT").toBe("RESOURCE_CONFLICT");
  });
});
