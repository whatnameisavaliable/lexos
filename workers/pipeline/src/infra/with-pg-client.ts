import type { Pool, PoolClient } from "pg";

const TRANSIENT_PG_ERRORS = new Set([
  "ECONNRESET",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "EPIPE",
]);

function isTransientPgError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  if (TRANSIENT_PG_ERRORS.has(error.code ?? "")) {
    return true;
  }
  const message = error.message.toLowerCase();
  return (
    message.includes("connection terminated") ||
    message.includes("connection timeout") ||
    message.includes("client has encountered a connection error")
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 从连接池借出客户端并在结束后释放；对瞬时断连自动重试。
 */
export async function withPgClient<T>(
  pool: Pool,
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const maxAttempts = 3;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    let client: PoolClient | undefined;
    try {
      client = await pool.connect();
      return await fn(client);
    } catch (error) {
      lastError = error;
      if (!isTransientPgError(error) || attempt >= maxAttempts) {
        throw error;
      }
      await sleep(200 * attempt);
    } finally {
      client?.release();
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}
