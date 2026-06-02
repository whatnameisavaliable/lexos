import fs from "node:fs";
import path from "node:path";
import pg from "pg";
import { resolveRepoRoot } from "../config/env.js";
import { SOP_AI_FEATURE_KEY_VALUES } from "../enums/sop-ai-feature-keys.js";

/** SOP AI 映射种子 SQL 文件路径。 */
export function resolveSopAiMappingsSeedPath(
  repoRoot: string = resolveRepoRoot(),
): string {
  return path.join(repoRoot, "supabase", "seeds", "sop_ai_mappings.sql");
}

/**
 * 读取 SOP AI 映射种子文件全文。
 */
export function readSopAiMappingsSeed(
  repoRoot: string = resolveRepoRoot(),
): string {
  return fs.readFileSync(resolveSopAiMappingsSeedPath(repoRoot), "utf8");
}

/**
 * 断言种子文件包含四个 SOP feature_key 字面量。
 */
export function assertSopAiMappingsSeedContent(
  repoRoot: string = resolveRepoRoot(),
): void {
  const content = readSopAiMappingsSeed(repoRoot);
  for (const key of SOP_AI_FEATURE_KEY_VALUES) {
    if (!content.includes(key)) {
      throw new Error(`SOP seed missing feature_key literal: ${key}`);
    }
  }
}

/** `ai_feature_model_mappings` 插入行。 */
export interface SopAiMappingInsertRow {
  readonly featureKey: string;
  readonly primaryModelId: string;
}

/**
 * 构建幂等 INSERT SQL（不含 API Key；仅引用 model id）。
 */
export function buildSopAiMappingsInsertSql(primaryModelId: string): string {
  const values = SOP_AI_FEATURE_KEY_VALUES.map(
    (key) => `  ('${key}'::public.ai_feature_key, '${primaryModelId}'::uuid)`,
  ).join(",\n");

  return `INSERT INTO public.ai_feature_model_mappings (feature_key, primary_model_id)
VALUES
${values}
ON CONFLICT (feature_key) DO NOTHING;`;
}

export interface RunSopAiMappingsSeedResult {
  readonly inserted: boolean;
  readonly modelId: string | null;
  readonly skippedReason: string | null;
}

/**
 * 查询默认 fallback 模型 ID；不存在则返回 null。
 */
export async function findDefaultFallbackModelId(
  client: pg.Client,
): Promise<string | null> {
  const { rows } = await client.query<{ id: string }>(
    `SELECT id FROM public.ai_model_credentials
     WHERE is_default_fallback = true AND is_enabled = true
     LIMIT 1`,
  );
  return rows[0]?.id ?? null;
}

/**
 * 为四 SOP 功能点插入映射（幂等）；无默认模型时跳过。
 */
export async function runSopAiMappingsSeed(
  connectionString: string,
): Promise<RunSopAiMappingsSeedResult> {
  const client = new pg.Client({ connectionString });
  await client.connect();

  try {
    const modelId = await findDefaultFallbackModelId(client);
    if (!modelId) {
      return {
        inserted: false,
        modelId: null,
        skippedReason: "no default fallback ai_model_credentials row",
      };
    }

    const sql = buildSopAiMappingsInsertSql(modelId);
    await client.query(sql);

    return { inserted: true, modelId, skippedReason: null };
  } finally {
    await client.end();
  }
}
