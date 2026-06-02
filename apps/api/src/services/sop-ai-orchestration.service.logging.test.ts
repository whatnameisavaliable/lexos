import { describe, expect, it, vi } from "vitest";
import {
  logSopInvocationFailure,
  logSopInvocationSuccess,
} from "./sop-ai-orchestration.service.js";

describe("logSopInvocationSuccess", () => {
  it("persists pipeline_id and step_code in metadata", async () => {
    const insertInvocationLog = vi.fn(async () => {});
    await logSopInvocationSuccess({ insertInvocationLog } as never, {
      featureKey: "sop.fact_extract",
      modelId: "m1",
      isFallback: false,
      latencyMs: 12,
      metadata: {
        pipeline_id: "pipe-1",
        step_code: "01-A",
      },
    });
    expect(insertInvocationLog).toHaveBeenCalledWith(
      expect.objectContaining({
        taskId: null,
        metadata: { pipeline_id: "pipe-1", step_code: "01-A" },
        outcome: "success",
      }),
    );
  });
});

describe("logSopInvocationFailure", () => {
  it("writes failure outcome with null task_id", async () => {
    const insertInvocationLog = vi.fn(async () => {});
    await logSopInvocationFailure(
      { insertInvocationLog } as never,
      {
        featureKey: "sop.fact_extract",
        modelId: "m1",
        isFallback: false,
        metadata: { pipeline_id: "pipe-1", step_code: "01-A" },
      },
      new Error("boom"),
    );
    expect(insertInvocationLog).toHaveBeenCalledWith(
      expect.objectContaining({
        taskId: null,
        outcome: "failure",
      }),
    );
  });
});
