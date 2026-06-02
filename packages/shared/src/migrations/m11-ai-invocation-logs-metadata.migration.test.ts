import { describe, expect, it } from "vitest";
import { readMigrationSql } from "./migration-test-helper.js";

describe("M11 ai_invocation_logs_sop_metadata migration", () => {
  const sql = readMigrationSql("ai_invocation_logs_sop_metadata");

  it("adds metadata JSONB column with default empty object", () => {
    expect(sql).toContain("metadata JSONB");
    expect(sql).toContain("DEFAULT '{}'::jsonb");
  });

  it("creates GIN index on metadata with jsonb_path_ops", () => {
    expect(sql).toContain("ai_invocation_logs_metadata_gin_idx");
    expect(sql).toContain("USING gin (metadata jsonb_path_ops)");
  });
});
