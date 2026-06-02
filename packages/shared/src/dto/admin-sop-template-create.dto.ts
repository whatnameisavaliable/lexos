import { z } from "zod";
import { adminSopStepUpsertSchema } from "./admin-sop-step-upsert.dto.js";

const nameSchema = z
  .string()
  .trim()
  .min(1, "name must not be empty")
  .max(256, "name must be at most 256 characters");

const caseTypeSchema = z
  .string()
  .trim()
  .min(1, "caseType must not be empty")
  .max(64, "caseType must be at most 64 characters");

/**
 * `POST /api/admin/sops/templates` 请求体（`database.md` §3.16.1）。
 */
export const adminSopTemplateCreateBodySchema = z.object({
  name: nameSchema,
  caseType: caseTypeSchema,
  steps: z.array(adminSopStepUpsertSchema).optional(),
});

/** 创建 SOP 逻辑模板 DTO（解析后）。 */
export type AdminSopTemplateCreateBody = z.infer<
  typeof adminSopTemplateCreateBodySchema
>;

/**
 * 解析并校验创建 SOP 模板请求体；失败抛出 `ZodError`。
 */
export function parseAdminSopTemplateCreateBody(
  input: unknown,
): AdminSopTemplateCreateBody {
  return adminSopTemplateCreateBodySchema.parse(input);
}
