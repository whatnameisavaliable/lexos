import { describe, expect, it } from "vitest";
import { readMigrationSql } from "./migration-test-helper.js";

describe("M10 audit_action_sop migration", () => {
  it("extends audit_action with SOP events", () => {
    const sql = readMigrationSql("audit_action_sop");
    expect(sql).toContain("sop.template.publish");
    expect(sql).toContain("sop.prompt.update");
    expect(sql).toContain("sop.artifact.export_pdf");
    expect(sql).toContain("sop.artifact.verify");
  });
});
