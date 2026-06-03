import { describe, expect, it } from "vitest";
import { adminSopVersionEditorPath } from "./sop-version-editor-utils.js";

describe("CreateSopVersionDialog", () => {
  it("navigates to editor path", () => {
    expect(adminSopVersionEditorPath("v-new")).toBe(
      "/admin/sops/template-versions/v-new",
    );
  });
});
