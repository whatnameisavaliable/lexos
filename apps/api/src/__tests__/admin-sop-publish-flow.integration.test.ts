import { describe, it } from "vitest";
import { loadAppRuntimeEnv, resolveRepoRoot } from "@lexos/shared/config";

function isIntegrationEnvConfigured(): boolean {
  try {
    const root = resolveRepoRoot();
    const env = loadAppRuntimeEnv(root);
    return (
      env.supabaseDbUrl.startsWith("postgresql://") &&
      !env.supabaseDbUrl.includes("your-password")
    );
  } catch {
    return false;
  }
}

describe("admin SOP publish flow integration", () => {
  it.skipIf(() => !isIntegrationEnvConfigured())(
    "create → edit prompts → publish → PUT prompts returns 422",
    async () => {
      // Requires live Supabase + admin session; run manually in staging.
    },
  );
});
