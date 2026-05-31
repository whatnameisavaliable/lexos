/** 判断连接串是否为模板占位符（未配置真实密码/项目）。 */
export function isPlaceholderDatabaseUrl(connectionString: string): boolean {
  const lower = connectionString.toLowerCase();
  return (
    lower.includes("your-password") ||
    lower.includes("your-project-ref") ||
    lower.includes("[password]") ||
    lower.includes("[ref]")
  );
}

/** 解析连接串中的 pooler 端口（用于启动日志，不含密码）。 */
export function describeDatabaseEndpoint(connectionString: string): string {
  try {
    const url = new URL(connectionString);
    const port = url.port || "5432";
    const host = url.hostname;
    const mode = port === "6543" ? "transaction-pooler" : "session-pooler";
    return `${host}:${port} (${mode})`;
  } catch {
    return "invalid-url";
  }
}

/**
 * Worker 启动前校验数据库 URL；占位符或缺失时抛出可读错误。
 */
export function assertUsableWorkerDatabaseUrl(connectionString: string): void {
  if (!connectionString.trim()) {
    throw new Error(
      "Missing WORKER_DB_URL / SUPABASE_DB_URL. Set WORKER_DB_URL in .env.development (Session pooler :5432 recommended).",
    );
  }
  if (isPlaceholderDatabaseUrl(connectionString)) {
    throw new Error(
      "Database URL still contains placeholder values (your-password / your-project-ref). " +
        "Update .env.development with your Supabase credentials. " +
        "Worker should use Session pooler port 5432 via WORKER_DB_URL.",
    );
  }
}
