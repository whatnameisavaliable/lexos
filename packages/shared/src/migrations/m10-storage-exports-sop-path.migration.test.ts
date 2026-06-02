import { describe, expect, it } from "vitest";
import { readMigrationSql } from "./migration-test-helper.js";

describe("M10 storage_exports_sop_path migration", () => {
  it("requires sops path segment for exports insert", () => {
    const sql = readMigrationSql("storage_exports_sop_path");
    expect(sql).toContain("exports");
    expect(sql).toContain("'sops'");
    expect(sql).toContain("auth.uid()::text");
  });
});
