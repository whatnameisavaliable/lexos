import { describe, expect, it } from "vitest";
import { readMigrationSql } from "./migration-test-helper.js";

describe("M10 enums_sop migration", () => {
  const sql = readMigrationSql("enums_sop");

  it("defines sop_execution_type with three values", () => {
    expect(sql).toContain("sop_execution_type");
    expect(sql).toContain("'sync_llm'");
    expect(sql).toContain("'async_deep_research'");
    expect(sql).toContain("'manual'");
  });

  it("defines case_pipeline_status", () => {
    expect(sql).toContain("case_pipeline_status");
    expect(sql).toContain("'in_progress'");
    expect(sql).toContain("'completed'");
    expect(sql).toContain("'suspended'");
  });

  it("defines pipeline_artifact_status with four states", () => {
    expect(sql).toContain("pipeline_artifact_status");
    expect(sql).toContain("'running'");
    expect(sql).toContain("'draft'");
    expect(sql).toContain("'failed'");
    expect(sql).toContain("'finalized'");
  });

  it("defines artifact_content_type", () => {
    expect(sql).toContain("artifact_content_type");
    expect(sql).toContain("'markdown'");
    expect(sql).toContain("'html'");
    expect(sql).toContain("'json'");
  });

  it("extends ai_feature_key with four SOP values", () => {
    expect(sql).toContain("ADD VALUE IF NOT EXISTS 'sop.fact_extract'");
    expect(sql).toContain("ADD VALUE IF NOT EXISTS 'sop.strategy_gen'");
    expect(sql).toContain("ADD VALUE IF NOT EXISTS 'sop.deep_research'");
    expect(sql).toContain("ADD VALUE IF NOT EXISTS 'sop.visual_charting'");
  });
});
