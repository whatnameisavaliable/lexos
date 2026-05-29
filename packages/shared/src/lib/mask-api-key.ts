/**
 * 将 API Key 掩码为对外安全展示格式（如 `sk-***`；`architecture.md` §6.4.3）。
 * @param apiKey - 明文密钥（仅内存中使用，禁止写入日志）
 */
export function maskApiKey(apiKey: string): string {
  const trimmed = apiKey.trim();
  if (trimmed.length === 0) {
    return "***";
  }
  const visiblePrefix = Math.min(3, trimmed.length);
  const prefix = trimmed.slice(0, visiblePrefix);
  return `${prefix}***`;
}
