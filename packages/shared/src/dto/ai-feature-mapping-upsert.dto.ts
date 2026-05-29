import { z } from "zod";

const uuidSchema = z.string().uuid();

/**
 * `PUT /api/admin/ai/mappings/:featureKey` 请求体（`database.md` §3.8）。
 */
export const aiFeatureMappingUpsertBodySchema = z.object({
  primaryModelId: uuidSchema,
  fallbackModelId: uuidSchema.optional().nullable(),
});

/** 功能-模型映射 upsert DTO（解析后）。 */
export type AiFeatureMappingUpsertBody = z.infer<
  typeof aiFeatureMappingUpsertBodySchema
>;

/**
 * 解析并校验映射 upsert 请求体；失败抛出 `ZodError`。
 */
export function parseAiFeatureMappingUpsertBody(
  input: unknown,
): AiFeatureMappingUpsertBody {
  return aiFeatureMappingUpsertBodySchema.parse(input);
}
