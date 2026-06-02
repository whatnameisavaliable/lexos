import { describe, expect, it } from "vitest";
import { readMigrationSql } from "./migration-test-helper.js";

describe("M10 rls_sop migration", () => {
  it("enables RLS on SOP tables", () => {
    const sql = readMigrationSql("rls_sop");
    expect(sql).toContain("sop_templates ENABLE ROW LEVEL SECURITY");
    expect(sql).toContain("case_pipelines ENABLE ROW LEVEL SECURITY");
    expect(sql).toContain("pipeline_artifacts ENABLE ROW LEVEL SECURITY");
  });

  it("lawyer template version policy requires is_published", () => {
    const sql = readMigrationSql("rls_sop");
    expect(sql).toContain("is_published = true");
  });

  it("case_pipelines has no admin read policy", () => {
    const sql = readMigrationSql("rls_sop");
    const lawyerPolicy = sql.match(
      /CREATE POLICY case_pipelines_lawyer[\s\S]*?;\r?\n/,
    )?.[0];
    expect(lawyerPolicy).toBeDefined();
    expect(lawyerPolicy).not.toContain("is_admin()");
    expect(sql).not.toMatch(
      /CREATE POLICY case_pipelines_admin[\s\S]*?is_admin\(\)/,
    );
  });
});
