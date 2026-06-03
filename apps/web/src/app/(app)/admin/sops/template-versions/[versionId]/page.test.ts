import { describe, expect, it } from "vitest";
import { adminSopVersionEditorPath } from "@/components/admin/sops/sop-version-editor-utils";

describe("AdminSopVersionEditorPage", () => {
  it("mounts version editor route", () => {
    expect(adminSopVersionEditorPath("v1")).toBe(
      "/admin/sops/template-versions/v1",
    );
  });
});
