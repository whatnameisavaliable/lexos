import { describe, expect, it, vi } from "vitest";
import { createMockPool } from "../test/pg-test-helpers.js";
import { PipelineStageProcessorService } from "../services/pipeline-stage-processor.service.js";

describe("SOP outbox idempotency integration", () => {
  it("returns skipped_duplicate on second consumption of same outbox_event_id", async () => {
    const sopHandler = { handle: vi.fn().mockResolvedValue(undefined) };
    const sopRouter = { resolve: vi.fn().mockReturnValue(sopHandler) };
    const idempotency = {
      tryBeginRun: vi
        .fn()
        .mockResolvedValueOnce({ proceed: true, existingRunId: "run-1" })
        .mockResolvedValueOnce({ proceed: false }),
      markSucceeded: vi.fn(),
      markFailed: vi.fn(),
    };
    const outboxRepository = {
      markPublished: vi.fn().mockResolvedValue(undefined),
    };

    const processor = new PipelineStageProcessorService(
      { resolve: vi.fn() } as never,
      sopRouter as never,
      idempotency as never,
      outboxRepository as never,
      { handle: vi.fn() } as never,
      { handle: vi.fn() } as never,
    );

    const pool = createMockPool();
    const event = { id: "evt-dup-2" } as never;
    const payload = {
      stage: "sop.deep_research" as const,
      pipeline_id: "pipe-1",
      step_code: "02-B",
      artifact_id: "art-1",
    };

    const first = await processor.processStage(pool, event, payload);
    const second = await processor.processStage(pool, event, payload);

    expect(first).toEqual({ kind: "executed" });
    expect(second).toEqual({ kind: "skipped_duplicate" });
    expect(sopHandler.handle).toHaveBeenCalledTimes(1);
  });
});
