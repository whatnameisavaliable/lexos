import { describe, expect, it } from "vitest";
import { readMigrationSql } from "./migration-test-helper.js";

describe("M10 upload_sessions_sop migration", () => {
  it("adds pipeline_id and task-or-pipeline check", () => {
    const sql = readMigrationSql("upload_sessions_sop");
    expect(sql).toContain("pipeline_id");
    expect(sql).toContain("task_id DROP NOT NULL");
    expect(sql).toContain("upload_sessions_task_or_pipeline_chk");
  });
});
