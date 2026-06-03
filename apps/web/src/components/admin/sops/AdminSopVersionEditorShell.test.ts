import { describe, expect, it } from "vitest";
import { isVersionEditorReadOnly } from "./sop-version-editor-utils.js";

describe("AdminSopVersionEditorShell", () => {
  it("marks published versions read-only", () => {
    expect(isVersionEditorReadOnly(true)).toBe(true);
  });
});
