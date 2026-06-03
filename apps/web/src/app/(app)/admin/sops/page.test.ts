import { describe, expect, it } from "vitest";
import { adminSopTemplateDetailPath, adminSopVersionEditorPath } from "@/components/admin/sops/sop-version-editor-utils";

describe("AdminSopsPage", () => {
  it("uses admin SOP route prefix", () => {
    expect(adminSopTemplateDetailPath("t1")).toMatch(/^\/admin\/sops\//);
    expect(adminSopVersionEditorPath("v1")).toMatch(/^\/admin\/sops\//);
  });
});
