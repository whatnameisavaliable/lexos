import { describe, expect, it } from "vitest";
import { Client } from "pg";
import { loadAppRuntimeEnv, resolveRepoRoot } from "@lexos/shared/config";

const env = loadAppRuntimeEnv(resolveRepoRoot());
const hasDb =
  env.supabaseDbUrl.startsWith("postgresql://") &&
  !env.supabaseDbUrl.includes("your-password");

describe.skipIf(!hasDb)("audit_logs immutability (database)", () => {
  it("rejects UPDATE and DELETE on audit_logs", async () => {
    const connectionString = env.supabaseDbUrl;
    const client = new Client({ connectionString });
    await client.connect();

    try {
      await expect(
        client.query(`UPDATE public.audit_logs SET action = 'auth.logout' WHERE false`),
      ).rejects.toThrow(/audit_log_immutable/i);

      await expect(
        client.query(`DELETE FROM public.audit_logs WHERE false`),
      ).rejects.toThrow(/audit_log_immutable/i);
    } finally {
      await client.end();
    }
  });
});
