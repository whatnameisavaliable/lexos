import { describe, expect, it } from "vitest";
import { adminSopVersionEditorPath } from "./sop-version-editor-utils.js";

describe("SopTemplateVersionsTable", () => {
  it("links to version editor path", () => {
    expect(adminSopVersionEditorPath("v1")).toContain("v1");
  });
});
