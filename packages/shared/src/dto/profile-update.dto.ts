import { z } from "zod";

/** `profiles.display_name` 最大长度（`database.md` §3.1）。 */
export const DISPLAY_NAME_MAX_LENGTH = 128;

/** `profiles.contact` 最大长度（`database.md` §3.1）。 */
export const CONTACT_MAX_LENGTH = 256;

/**
 * `PATCH /api/profile` 请求体（PRD §3.2；禁止改 `role/status/username/mfa_enabled`）。
 */
export const profileUpdateBodySchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(1, "displayName cannot be empty")
      .max(DISPLAY_NAME_MAX_LENGTH)
      .optional(),
    contact: z
      .string()
      .trim()
      .max(CONTACT_MAX_LENGTH)
      .nullable()
      .optional(),
  })
  .refine(
    (value) => value.displayName !== undefined || value.contact !== undefined,
    { message: "at least one of displayName or contact must be provided" },
  );

/** 个人资料更新 DTO（解析后）。 */
export type ProfileUpdateBody = z.infer<typeof profileUpdateBodySchema>;

/**
 * 解析并校验资料更新请求体；失败抛出 `ZodError`。
 */
export function parseProfileUpdateBody(input: unknown): ProfileUpdateBody {
  return profileUpdateBodySchema.parse(input);
}
