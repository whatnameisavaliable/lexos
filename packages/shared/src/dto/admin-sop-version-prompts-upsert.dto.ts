import { z } from "zod";
import { adminSopStepUpsertSchema } from "./admin-sop-step-upsert.dto.js";

/**
 * `PUT /api/admin/sops/template-versions/:id/prompts` 请求体（整包替换草稿步骤）。
 */
export const adminSopVersionPromptsUpsertBodySchema = z
  .object({
    steps: z.array(adminSopStepUpsertSchema).min(1, "steps must not be empty"),
  })
  .superRefine((body, ctx) => {
    const seen = new Set<string>();
    for (const step of body.steps) {
      if (seen.has(step.stepCode)) {
        ctx.addIssue({
          code: "custom",
          message: `duplicate stepCode "${step.stepCode}"`,
          path: ["steps"],
        });
        return;
      }
      seen.add(step.stepCode);
    }
  });

/** 草稿步骤整包替换 DTO（解析后）。 */
export type AdminSopVersionPromptsUpsertBody = z.infer<
  typeof adminSopVersionPromptsUpsertBodySchema
>;

/**
 * 解析并校验 prompts upsert 请求体；失败抛出 `ZodError`。
 */
export function parseAdminSopVersionPromptsUpsertBody(
  input: unknown,
): AdminSopVersionPromptsUpsertBody {
  return adminSopVersionPromptsUpsertBodySchema.parse(input);
}
