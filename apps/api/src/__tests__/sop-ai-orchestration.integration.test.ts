import pg from "pg";
import { describe, expect, it, vi } from "vitest";
import { loadAppRuntimeEnv, loadSupabaseEnv, resolveRepoRoot } from "@lexos/shared/config";
import { SopAiOrchestrationService } from "../services/sop-ai-orchestration.service.js";
import { SopAiConfigRepository } from "../repositories/sop-ai-config.repository.js";
import { AiInvocationLogRepository } from "../repositories/ai-invocation-log.repository.js";

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

describe("SopAiOrchestration integration", () => {
  it.skipIf(() => !isIntegrationEnvConfigured())(
    "writes ai_invocation_logs with null task_id and pipeline metadata",
    async () => {
      const root = resolveRepoRoot();
      const appEnv = loadAppRuntimeEnv(root);
      const supabaseEnv = loadSupabaseEnv(root);

      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          json: async () => ({
            choices: [{ message: { content: "integration ok" } }],
            usage: { prompt_tokens: 1, completion_tokens: 1 },
          }),
        }),
      );

      const configRepo = SopAiConfigRepository.fromSupabaseEnv(
        supabaseEnv,
        appEnv,
      );
      const logRepo = AiInvocationLogRepository.fromSupabaseEnv(supabaseEnv);
      const service = new SopAiOrchestrationService(
        configRepo,
        logRepo,
        5_000,
      );

      const pipelineId = "00000000-0000-4000-8000-000000000099";
      await service.invokeSopLlm({
        pipelineId,
        stepCode: "01-A",
        featureKey: "sop.fact_extract",
        userPromptTemplate: "{{sop_media_extracted_text}}",
        promptContext: {
          finalizedArtifacts: [],
          formValues: {},
          sopMediaExtractedText: "test",
        },
      });

      const client = new pg.Client({ connectionString: appEnv.supabaseDbUrl });
      await client.connect();
      try {
        const { rows } = await client.query<{
          task_id: string | null;
          metadata: { pipeline_id?: string };
        }>(
          `SELECT task_id, metadata
           FROM public.ai_invocation_logs
           WHERE metadata->>'pipeline_id' = $1
           ORDER BY created_at DESC
           LIMIT 1`,
          [pipelineId],
        );
        expect(rows[0]?.task_id).toBeNull();
        expect(rows[0]?.metadata?.pipeline_id).toBe(pipelineId);
      } finally {
        await client.end();
      }

      vi.unstubAllGlobals();
    },
  );
});
