import { describe, expect, it } from "vitest";
import { readMigrationSql } from "./migration-test-helper.js";

describe("M10 tables_sop_template_versions migration", () => {
  it("creates version table with unique constraint and is_published", () => {
    const sql = readMigrationSql("tables_sop_template_versions");
    expect(sql).toContain("UNIQUE (template_id, version_number)");
    expect(sql).toContain("is_published");
  });
});
