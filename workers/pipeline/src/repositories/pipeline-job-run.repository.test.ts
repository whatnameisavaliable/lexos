import { describe, expect, it, vi } from "vitest";
import { PIPELINE_STAGE_ASR } from "@lexos/shared";
import { PipelineJobRunRepository } from "./pipeline-job-run.repository.js";

describe("PipelineJobRunRepository", () => {
  it("returns proceed false on unique violation", async () => {
    const client = {
      query: vi
        .fn()
        .mockRejectedValueOnce({ code: "23505" })
        .mockResolvedValueOnce({ rows: [{ id: "run-1" }] }),
    };
    const repo = new PipelineJobRunRepository();
    const result = await repo.tryBeginRun(client as never, {
      stage: PIPELINE_STAGE_ASR,
      outboxEventId: "evt-1",
      taskId: "task-1",
    });
    expect(result.proceed).toBe(false);
    expect(result.runId).toBe("run-1");
  });
});
