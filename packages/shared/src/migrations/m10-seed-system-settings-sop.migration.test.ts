import { describe, expect, it } from "vitest";
import { readMigrationSql } from "./migration-test-helper.js";

describe("M10 seed_system_settings_sop migration", () => {
  it("seeds sop.deep_research_enabled", () => {
    const sql = readMigrationSql("seed_system_settings_sop");
    expect(sql).toContain("INSERT INTO public.system_settings");
    expect(sql).toContain("sop.deep_research_enabled");
  });
});
