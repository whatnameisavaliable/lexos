import { isUserRole, type UserRole } from "../types/user-role.js";
import { requireEnv } from "./env.js";

/** 验证码提供商（`architecture.md` §4.4）。 */
export type CaptchaProvider = "none" | "turnstile" | "geetest";

/** U2 Auth 中间件与 Adapter 运行时配置。 */
export interface AuthRuntimeEnvConfig {
  readonly authVirtualEmailDomain: string;
  readonly captchaProvider: CaptchaProvider;
  readonly captchaSecretKey: string | undefined;
  readonly mfaRequiredRoles: readonly UserRole[];
}

/**
 * 解析逗号分隔的 `MFA_REQUIRED_ROLES`。
 */
export function parseMfaRequiredRoles(raw: string): readonly UserRole[] {
  const roles = raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  const invalid = roles.filter((role) => !isUserRole(role));
  if (invalid.length > 0) {
    throw new Error(
      `Invalid MFA_REQUIRED_ROLES entries: ${invalid.join(", ")}`,
    );
  }
  return roles as UserRole[];
}

/**
 * 从 `process.env` 加载 Auth 运行时配置。
 */
export function loadAuthRuntimeEnvFromProcess(): AuthRuntimeEnvConfig {
  const provider = requireEnv("CAPTCHA_PROVIDER").toLowerCase();
  if (provider !== "none" && provider !== "turnstile" && provider !== "geetest") {
    throw new Error(
      `CAPTCHA_PROVIDER must be none, turnstile, or geetest; got: ${provider}`,
    );
  }

  const captchaSecretKey = process.env.CAPTCHA_SECRET_KEY?.trim() || undefined;
  if (provider !== "none" && !captchaSecretKey) {
    throw new Error(
      "CAPTCHA_SECRET_KEY is required when CAPTCHA_PROVIDER is not none",
    );
  }

  return {
    authVirtualEmailDomain: requireEnv("AUTH_VIRTUAL_EMAIL_DOMAIN"),
    captchaProvider: provider,
    captchaSecretKey,
    mfaRequiredRoles: parseMfaRequiredRoles(
      requireEnv("MFA_REQUIRED_ROLES"),
    ),
  };
}
