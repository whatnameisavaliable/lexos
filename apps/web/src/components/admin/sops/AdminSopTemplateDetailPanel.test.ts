import { describe, expect, it } from "vitest";
import { adminSopTemplateDetailPath } from "./sop-version-editor-utils.js";

describe("AdminSopTemplateDetailPanel", () => {
  it("builds template detail path", () => {
    expect(adminSopTemplateDetailPath("t1")).toBe("/admin/sops/templates/t1");
  });
});
