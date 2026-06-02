import { describe, expect, it, vi } from "vitest";
import { WorkerAiRepository } from "./worker-ai.repository.js";

describe("WorkerAiRepository.insertInvocationLog", () => {
  it("includes metadata jsonb binding", async () => {
    const query = vi.fn(async () => {});
    const client = { query } as never;
    const repo = new WorkerAiRepository(
      { supabaseUrl: "http://x", supabaseServiceRoleKey: "k" } as never,
      { aiCredentialEncryptionKey: Buffer.alloc(32).toString("base64") } as never,
    );

    await repo.insertInvocationLog(client, {
      taskId: null,
      featureKey: "sop.fact_extract",
      modelId: "m1",
      isFallback: false,
      latencyMs: 1,
      outcome: "success",
      idempotencyKey: "idem",
      metadata: { pipeline_id: "p1", step_code: "01-A" },
    });

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("metadata"),
      expect.arrayContaining([
        JSON.stringify({ pipeline_id: "p1", step_code: "01-A" }),
      ]),
    );
  });
});
