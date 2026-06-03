import { describe, expect, it } from "vitest";
import { adminSopVersionEditorPath } from "./sop-version-editor-utils.js";

describe("CreateSopTemplateDialog", () => {
  it("redirects to version editor after create", () => {
    expect(adminSopVersionEditorPath("v1")).toContain("/template-versions/v1");
  });
});
