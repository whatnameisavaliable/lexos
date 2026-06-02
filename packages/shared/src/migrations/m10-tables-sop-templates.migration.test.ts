import { describe, expect, it } from "vitest";
import { readMigrationSql } from "./migration-test-helper.js";

describe("M10 tables_sop_templates migration", () => {
  it("creates sop_templates with case_type", () => {
    const sql = readMigrationSql("tables_sop_templates");
    expect(sql).toContain("CREATE TABLE public.sop_templates");
    expect(sql).toContain("case_type VARCHAR");
  });
});
