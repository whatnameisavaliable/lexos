import { z } from "zod";

/**
 * `POST /api/admin/sops/templates/:template_id/versions` 请求体。
 * `sourceVersionId` 缺省时由 Service 取最新已发布版。
 */
export const adminSopCreateVersionBodySchema = z.object({
  sourceVersionId: z
    .string()
    .uuid({ message: "sourceVersionId must be a UUID" })
    .optional(),
});

/** 新建草稿版本 DTO（解析后）。 */
export type AdminSopCreateVersionBody = z.infer<
  typeof adminSopCreateVersionBodySchema
>;

/**
 * 解析并校验新建版本请求体；失败抛出 `ZodError`。
 */
export function parseAdminSopCreateVersionBody(
  input: unknown,
): AdminSopCreateVersionBody {
  return adminSopCreateVersionBodySchema.parse(input ?? {});
}
