import { z } from "zod";
import {
  normalizeUsername,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  USERNAME_PATTERN,
} from "../validation/username.js";

/** TOTP 验证码位数（PRD §2.5.2）。 */
export const TOTP_CODE_LENGTH = 6;

const usernameSchema = z
  .string()
  .trim()
  .min(USERNAME_MIN_LENGTH, "username is required")
  .max(USERNAME_MAX_LENGTH)
  .transform((value) => value.toLowerCase())
  .refine((value) => USERNAME_PATTERN.test(value), {
    message:
      "username may only contain lowercase letters, digits, and underscores",
  });

const passwordSchema = z
  .string()
  .min(1, "password is required")
  .max(128, "password is too long");

const totpCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, `totpCode must be ${TOTP_CODE_LENGTH} digits`)
  .optional();

/**
 * `POST /api/auth/login` 请求体（PRD §3.2；`architecture.md` §7）。
 */
export const authLoginBodySchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
  captchaToken: z.string().trim().min(1).optional(),
  totpCode: totpCodeSchema,
});

/** 登录请求 DTO（解析后）。 */
export type AuthLoginBody = z.infer<typeof authLoginBodySchema>;

/**
 * 解析并校验登录请求体；失败抛出 `ZodError`。
 */
export function parseAuthLoginBody(input: unknown): AuthLoginBody {
  return authLoginBodySchema.parse(input);
}

/**
 * 将登录 DTO 中的用户名规范化为 `profiles.username` 格式。
 */
export function authLoginNormalizedUsername(body: AuthLoginBody): string {
  return normalizeUsername(body.username);
}
