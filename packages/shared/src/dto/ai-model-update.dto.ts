import { z } from "zod";
import {
  AI_PROVIDER_KIND_VALUES,
  type AiProviderKind,
} from "../enums/ai-provider-kind.js";

const providerKindSchema = z.enum(
  AI_PROVIDER_KIND_VALUES as [AiProviderKind, ...AiProviderKind[]],
);

const nameSchema = z.string().trim().min(1).max(128);
const modelNameSchema = z.string().trim().min(1).max(128);
const modelIdSchema = z.string().trim().min(1).max(256);
const baseUrlSchema = z.union([
  z.string().trim().url().max(2048),
  z.literal("").transform(() => null),
  z.null(),
]);
const contextWindowSchema = z.coerce.number().int().positive().max(10_000_000);

/**
 * `PATCH /api/admin/ai/models/:id` 请求体；`apiKey` 空字符串表示不轮换密钥。
 */
export const aiModelUpdateBodySchema = z
  .object({
    name: nameSchema.optional(),
    providerKind: providerKindSchema.optional(),
    modelName: modelNameSchema.optional(),
    modelId: modelIdSchema.optional(),
    apiKey: z
      .string()
      .optional()
      .transform((value) => (value === undefined || value === "" ? undefined : value)),
    baseUrl: baseUrlSchema.optional(),
    contextWindow: contextWindowSchema.nullable().optional(),
    isEnabled: z.boolean().optional(),
    isDefaultFallback: z.boolean().optional(),
  })
  .refine(
    (body) =>
      body.name !== undefined ||
      body.providerKind !== undefined ||
      body.modelName !== undefined ||
      body.modelId !== undefined ||
      body.apiKey !== undefined ||
      body.baseUrl !== undefined ||
      body.contextWindow !== undefined ||
      body.isEnabled !== undefined ||
      body.isDefaultFallback !== undefined,
    { message: "at least one field must be provided" },
  );

/** 更新 AI 模型凭证 DTO（解析后）。 */
export type AiModelUpdateBody = z.infer<typeof aiModelUpdateBodySchema>;

/**
 * 解析并校验更新模型请求体；失败抛出 `ZodError`。
 */
export function parseAiModelUpdateBody(input: unknown): AiModelUpdateBody {
  return aiModelUpdateBodySchema.parse(input);
}
