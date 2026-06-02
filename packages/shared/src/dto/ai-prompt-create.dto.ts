import { z } from "zod";
import {
  ADMIN_CONFIGURABLE_FEATURE_KEY_VALUES,
  type AdminConfigurableFeatureKey,
} from "../ai/admin-configurable-feature-keys.js";

const adminConfigurableFeatureKeys = [
  ...ADMIN_CONFIGURABLE_FEATURE_KEY_VALUES,
] as unknown as [AdminConfigurableFeatureKey, ...AdminConfigurableFeatureKey[]];

const featureKeySchema = z.enum(adminConfigurableFeatureKeys, {
  message: "featureKey must be a valid AI feature key",
});

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
