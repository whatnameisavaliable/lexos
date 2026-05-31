import pg from "pg";
import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
config({ path: path.join(repoRoot, ".env.development"), override: true });

const connectionString =
  process.argv[2] === "6543"
    ? process.env.SUPABASE_DB_URL
    : process.env.WORKER_DB_URL ?? process.env.SUPABASE_DB_URL;
console.log("using port", connectionString?.match(/:(\d+)\//)?.[1]);
const isRemoteSupabase =
  connectionString.includes("supabase.co") ||
  connectionString.includes("supabase.com");
const usesTransactionPooler =
  isRemoteSupabase && connectionString.includes(":6543");

const poolConfig = {
  connectionString,
  max: usesTransactionPooler ? 4 : 10,
  application_name: "lexos-pipeline-worker-test",
  connectionTimeoutMillis: 15_000,
  idleTimeoutMillis: 20_000,
  allowExitOnIdle: true,
  ...(usesTransactionPooler ? { prepare: false } : {}),
  ...(isRemoteSupabase ? { ssl: { rejectUnauthorized: false } } : {}),
};

const pool = new pg.Pool(poolConfig);
pool.on("error", (e) => console.error("pool error:", e.message));

async function withPgClient(fn) {
  const client = await pool.connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}

async function pollOnce() {
  return withPgClient(async (client) => {
    await client.query("BEGIN");
    try {
      const result = await client.query(
        `SELECT id FROM public.outbox_events
         WHERE published_at IS NULL AND publish_attempts < 20
         ORDER BY created_at ASC
         LIMIT 20
         FOR UPDATE SKIP LOCKED`,
      );
      await client.query("COMMIT");
      return result.rows.length;
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw error;
    }
  });
}

for (let i = 0; i < 15; i += 1) {
  try {
    const count = await pollOnce();
    console.log(`poll ${i} ok count=${count}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`poll ${i} FAIL ${message}`);
  }
  await new Promise((resolve) => setTimeout(resolve, 1000));
}

await pool.end();
