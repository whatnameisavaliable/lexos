/**
 * 浏览器审计时序请求头（BFF `audit-client-metadata` 契约）。
 */
export const CLIENT_TIMESTAMP_HEADER = "X-Client-Timestamp";
export const CLIENT_TIMEZONE_HEADER = "X-Client-Timezone";

/** 为 BFF 请求附加客户端审计时序头。 */
export function buildClientAuditHeaders(): Record<string, string> {
  return {
    [CLIENT_TIMESTAMP_HEADER]: new Date().toISOString(),
    [CLIENT_TIMEZONE_HEADER]:
      Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC",
  };
}
