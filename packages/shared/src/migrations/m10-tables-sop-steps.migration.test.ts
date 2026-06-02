import { describe, expect, it } from "vitest";
import { readMigrationSql } from "./migration-test-helper.js";

describe("M10 tables_sop_steps migration", () => {
  it("creates sop_steps with depends_on and sop_execution_type", () => {
    const sql = readMigrationSql("tables_sop_steps");
    expect(sql).toContain("UNIQUE (template_version_id, step_code)");
    expect(sql).toContain("depends_on");
    expect(sql).toContain("execution_type public.sop_execution_type");
  });
});
