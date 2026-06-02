import { describe, expect, it, vi } from "vitest";
import { AiInvocationLogRepository } from "./ai-invocation-log.repository.js";

describe("AiInvocationLogRepository.insertInvocationLog", () => {
  it("binds null task_id for SOP invocations", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    const repo = new AiInvocationLogRepository({
      from: () => ({ insert }),
    } as never);

    await repo.insertInvocationLog({
      taskId: null,
      featureKey: "sop.fact_extract",
      modelId: "00000000-0000-4000-8000-000000000001",
      isFallback: false,
      latencyMs: 10,
      outcome: "success",
      metadata: {
        pipeline_id: "00000000-0000-4000-8000-000000000002",
        step_code: "01-A",
      },
    });

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ task_id: null }),
    );
  });
});
