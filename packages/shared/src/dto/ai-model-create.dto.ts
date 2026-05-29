import { z } from "zod";
import {
  AI_PROVIDER_KIND_VALUES,
  type AiProviderKind,
} from "../enums/ai-provider-kind.js";

const providerKindSchema = z.enum(
  AI_PROVIDER_KIND_VALUES as [AiProviderKind, ...AiProviderKind[]],
  { message: "providerKind must be a valid AI provider kind" },
);

const nameSchema = z.string().trim().min(1).max(128);
const modelNameSchema = z.string().trim().min(1).max(128);
const modelIdSchema = z.string().trim().min(1).max(256);
const apiKeySchema = z.string().min(1, "apiKey is required");
const baseUrlSchema = z.string().trim().url().max(2048).optional();
const contextWindowSchema = z.coerce.number().int().positive().max(10_000_000).optional();

/**
 * `POST /api/admin/ai/models` 请求体（`database.md` §3.7）。
 */
export const aiModelCreateBodySchema = z.object({
  name: nameSchema,
  providerKind: providerKindSchema,
  modelName: modelNameSchema,
  modelId: modelIdSchema,
  apiKey: apiKeySchema,
  baseUrl: baseUrlSchema,
  contextWindow: contextWindowSchema,
  isEnabled: z.boolean().optional(),
  isDefaultFallback: z.boolean().optional(),
});

/** 创建 AI 模型凭证 DTO（解析后）。 */
export type AiModelCreateBody = z.infer<typeof aiModelCreateBodySchema>;

/**
 * 解析并校验创建模型请求体；失败抛出 `ZodError`。
 */
export function parseAiModelCreateBody(input: unknown): AiModelCreateBody {
  return aiModelCreateBodySchema.parse(input);
}
