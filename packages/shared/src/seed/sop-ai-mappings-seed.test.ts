import { describe, expect, it } from "vitest";
import {
  assertSopAiMappingsSeedContent,
  buildSopAiMappingsInsertSql,
  readSopAiMappingsSeed,
} from "./sop-ai-mappings-seed.js";

describe("SOP AI mappings seed file", () => {
  it("contains four sop. feature_key literals", () => {
    expect(() => assertSopAiMappingsSeedContent()).not.toThrow();
    const content = readSopAiMappingsSeed();
    expect(content).toContain("sop.fact_extract");
    expect(content).toContain("sop.strategy_gen");
    expect(content).toContain("sop.deep_research");
    expect(content).toContain("sop.visual_charting");
  });

  it("buildSopAiMappingsInsertSql does not embed API keys", () => {
    const sql = buildSopAiMappingsInsertSql(
      "00000000-0000-4000-8000-000000000099",
    );
    expect(sql).toContain("ON CONFLICT (feature_key) DO NOTHING");
    expect(sql).not.toMatch(/sk-[a-zA-Z0-9]/);
    expect(sql).not.toContain("api_key");
  });
});
