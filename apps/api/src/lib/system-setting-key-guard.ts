/** 禁止写入 `system_settings` 的 key 子串（密钥类配置须走 `ai_model_credentials` 等）。 */
const FORBIDDEN_KEY_SUBSTRINGS = [
  "api_key",
  "apikey",
  "secret",
  "password",
  "credential",
  "token",
  "private_key",
] as const;

/**
 * 校验系统配置 key 是否允许写入；不允许则返回原因。
 */
export function assertSystemSettingKeyAllowed(key: string): void {
  const normalized = key.trim().toLowerCase();
  if (normalized.length === 0 || normalized.length > 128) {
    throw new Error("SYSTEM_SETTING_KEY_INVALID");
  }
  for (const fragment of FORBIDDEN_KEY_SUBSTRINGS) {
    if (normalized.includes(fragment)) {
      throw new Error("SYSTEM_SETTING_KEY_FORBIDDEN");
    }
  }
}
