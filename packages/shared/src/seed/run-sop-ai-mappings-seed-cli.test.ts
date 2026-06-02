import { describe, expect, it, vi } from "vitest";
import {
  buildSopAiMappingsInsertSql,
  findDefaultFallbackModelId,
} from "./sop-ai-mappings-seed.js";

describe("run-sop-ai-mappings-seed CLI helpers", () => {
  it("buildSopAiMappingsInsertSql never hardcodes secrets", () => {
    const sql = buildSopAiMappingsInsertSql(
      "11111111-1111-4111-8111-111111111111",
    );
    expect(sql).not.toMatch(/Bearer\s+/);
    expect(sql).not.toContain("api_key_ciphertext");
    expect(sql).toContain("sop.fact_extract");
    expect(sql).toContain("sop.visual_charting");
  });

  it("findDefaultFallbackModelId queries ai_model_credentials", async () => {
    const query = vi.fn().mockResolvedValue({ rows: [{ id: "model-1" }] });
    const client = { query } as unknown as import("pg").Client;

    const id = await findDefaultFallbackModelId(client);
    expect(id).toBe("model-1");
    expect(query.mock.calls[0]?.[0]).toContain("ai_model_credentials");
    expect(query.mock.calls[0]?.[0]).toContain("is_default_fallback");
  });
});
