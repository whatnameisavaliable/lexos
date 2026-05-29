import { z } from "zod";

const nameSchema = z.string().trim().min(1).max(128);
const systemPromptSchema = z
  .string()
  .min(1, "systemPrompt must not be empty");

/**
 * `PATCH /api/admin/ai/prompts/:id` 请求体；默认仅允许编辑未发布（draft）模板。
 */
export const aiPromptUpdateBodySchema = z
  .object({
    name: nameSchema.optional(),
    systemPrompt: systemPromptSchema.optional(),
  })
  .refine(
    (body) => body.name !== undefined || body.systemPrompt !== undefined,
    { message: "at least one field must be provided" },
  );

/** 更新 Prompt 模板 DTO（解析后）。 */
export type AiPromptUpdateBody = z.infer<typeof aiPromptUpdateBodySchema>;

/**
 * 解析并校验更新 Prompt 请求体；失败抛出 `ZodError`。
 */
export function parseAiPromptUpdateBody(input: unknown): AiPromptUpdateBody {
  return aiPromptUpdateBodySchema.parse(input);
}
