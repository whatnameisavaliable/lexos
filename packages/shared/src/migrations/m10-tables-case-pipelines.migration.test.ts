import { describe, expect, it } from "vitest";
import { readMigrationSql } from "./migration-test-helper.js";

describe("M10 tables_case_pipelines migration", () => {
  it("creates case_pipelines with lawyer_id and template FK", () => {
    const sql = readMigrationSql("tables_case_pipelines");
    expect(sql).toContain("case_pipeline_status");
    expect(sql).toContain("lawyer_id");
    expect(sql).toContain("REFERENCES public.sop_template_versions");
  });
});
