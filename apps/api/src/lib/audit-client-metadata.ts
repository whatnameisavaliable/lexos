/**
 * BFF 与浏览器之间的审计客户端时序契约（`database.md` §3.11）。
 */
export const CLIENT_TIMESTAMP_HEADER = "x-client-timestamp";
export const CLIENT_TIMEZONE_HEADER = "x-client-timezone";

/** 从请求头解析出的客户端审计元数据。 */
export interface ParsedAuditClientMetadata {
  readonly clientTimestamp?: string;
  readonly clientTimezone?: string;
}

function headerValue(
  headers: Record<string, string | string[] | undefined>,
  name: string,
): string | undefined {
  const raw = headers[name] ?? headers[name.toLowerCase()];
  if (raw === undefined) {
    return undefined;
  }
  const value = Array.isArray(raw) ? raw[0] : raw;
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

/**
 * 从 HTTP 请求头解析 `X-Client-Timestamp` / `X-Client-Timezone`。
 */
export function parseAuditClientHeaders(
  headers: Record<string, string | string[] | undefined>,
): ParsedAuditClientMetadata {
  const clientTimestamp = headerValue(headers, CLIENT_TIMESTAMP_HEADER);
  const clientTimezone = headerValue(headers, CLIENT_TIMEZONE_HEADER);
  return {
    ...(clientTimestamp ? { clientTimestamp } : {}),
    ...(clientTimezone ? { clientTimezone } : {}),
  };
}

/**
 * 将浏览器侧字段合并进 `audit_logs.metadata`（snake_case 入库键）。
 */
export function mergeAuditClientMetadata(
  metadata: Readonly<Record<string, unknown>> | undefined,
  client: ParsedAuditClientMetadata,
): Record<string, unknown> {
  const merged: Record<string, unknown> = { ...(metadata ?? {}) };
  if (client.clientTimestamp) {
    merged.client_timestamp = client.clientTimestamp;
  }
  if (client.clientTimezone) {
    merged.client_timezone = client.clientTimezone;
  }
  return merged;
}
