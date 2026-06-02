import { describe, expect, it } from "vitest";
import { readMigrationSql } from "./migration-test-helper.js";

describe("M10 tables_pipeline_artifacts migration", () => {
  it("creates pipeline_artifacts with snapshot and drive FK", () => {
    const sql = readMigrationSql("tables_pipeline_artifacts");
    expect(sql).toContain("finalized_snapshot_raw");
    expect(sql).toContain("UNIQUE (pipeline_id, step_code)");
    expect(sql).toContain("pipeline_artifacts_set_updated_at");
    expect(sql).toContain("linked_drive_node_id UUID REFERENCES public.drive_nodes");
  });
});
