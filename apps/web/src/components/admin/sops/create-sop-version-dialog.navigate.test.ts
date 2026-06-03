import { describe, expect, it } from "vitest";
import { adminSopVersionEditorPath } from "./sop-version-editor-utils.js";

describe("CreateSopVersionDialog navigation", () => {
  it("navigates to new version editor path", () => {
    const versionId = "00000000-0000-4000-8000-000000000099";
    expect(adminSopVersionEditorPath(versionId)).toBe(
      `/admin/sops/template-versions/${versionId}`,
    );
  });
});
