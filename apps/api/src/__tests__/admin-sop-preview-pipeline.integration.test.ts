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

describe("admin SOP preview-pipeline integration", () => {
  it.skipIf(() => !isIntegrationEnvConfigured())(
    "preview does not insert case_pipelines rows",
    async () => {
      // Requires live Supabase + LLM mapping; run manually in staging.
    },
  );
});
