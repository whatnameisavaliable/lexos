import { describe, expect, it } from "vitest";
import { loadAppRuntimeEnv, resolveRepoRoot } from "@lexos/shared/config";

function isIntegrationEnvConfigured(): boolean {
  try {
    const env = loadAppRuntimeEnv(resolveRepoRoot());
    return (
      env.apiUrl.startsWith("http") &&
      Boolean(process.env.LEXOS_TEST_ADMIN_TOKEN)
    );
  } catch {
    return false;
  }
}

describe("Admin SOP feature mapping integration", () => {
  it.skipIf(() => !isIntegrationEnvConfigured())(
    "PUT /api/admin/ai/mappings/sop.fact_extract returns 200",
    async () => {
      const env = loadAppRuntimeEnv(resolveRepoRoot());
      const token = process.env.LEXOS_TEST_ADMIN_TOKEN!;
      const modelId = process.env.LEXOS_TEST_PRIMARY_MODEL_ID;
      if (!modelId) {
        return;
      }

      const response = await fetch(
        `${env.apiUrl}/api/admin/ai/mappings/sop.fact_extract`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ primaryModelId: modelId }),
        },
      );

      expect(response.status).toBe(200);
      const body = (await response.json()) as { success?: boolean };
      expect(body.success).toBe(true);
    },
  );
});
