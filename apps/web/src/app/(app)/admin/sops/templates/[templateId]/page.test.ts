import { describe, expect, it } from "vitest";
import { adminSopTemplateDetailPath } from "@/components/admin/sops/sop-version-editor-utils";

describe("AdminSopTemplatePage", () => {
  it("mounts template detail route", () => {
    expect(adminSopTemplateDetailPath("t1")).toBe("/admin/sops/templates/t1");
  });
});
