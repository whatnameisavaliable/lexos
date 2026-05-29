import { z } from "zod";
import {
  AI_FEATURE_KEY_VALUES,
  type AiFeatureKey,
} from "../enums/ai-feature-key.js";

const featureKeySchema = z.enum(
  AI_FEATURE_KEY_VALUES as [AiFeatureKey, ...AiFeatureKey[]],
  { message: "featureKey must be a valid AI feature key" },
);

const nameSchema = z.string().trim().min(1).max(128);
const systemPromptSchema = z
  .string()
  .min(1, "systemPrompt must not be empty");

/**
 * `POST /api/admin/ai/prompts` 请求体（`database.md` §3.9）。
 */
export const aiPromptCreateBodySchema = z.object({
  featureKey: featureKeySchema,
  name: nameSchema,
  systemPrompt: systemPromptSchema,
});

/** 创建 Prompt 模板 DTO（解析后）。 */
export type AiPromptCreateBody = z.infer<typeof aiPromptCreateBodySchema>;

/**
 * 解析并校验创建 Prompt 请求体；失败抛出 `ZodError`。
 */
export function parseAiPromptCreateBody(input: unknown): AiPromptCreateBody {
  return aiPromptCreateBodySchema.parse(input);
}
