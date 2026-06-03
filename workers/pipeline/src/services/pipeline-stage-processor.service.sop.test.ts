import { describe, expect, it, vi } from "vitest";
import { createMockPool } from "../test/pg-test-helpers.js";
import { PipelineStageProcessorService } from "./pipeline-stage-processor.service.js";

describe("PipelineStageProcessorService — SOP", () => {
  it("skips duplicate SOP outbox and marks published", async () => {
    const sopHandler = { handle: vi.fn() };
    const sopRouter = {
      resolve: vi.fn().mockReturnValue(sopHandler),
    };
    const idempotency = {
      tryBeginRun: vi.fn().mockResolvedValue({ proceed: false }),
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

    const outcome = await processor.processStage(
      pool,
      { id: "evt-sop-dup" } as never,
      {
        stage: "sop.deep_research",
        pipeline_id: "pipe-1",
        step_code: "02-B",
        artifact_id: "art-1",
      },
    );

    expect(outcome).toEqual({ kind: "skipped_duplicate" });
    expect(sopHandler.handle).not.toHaveBeenCalled();
    expect(idempotency.tryBeginRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        taskId: null,
        stage: "sop.deep_research",
      }),
    );
    expect(outboxRepository.markPublished).toHaveBeenCalledWith(
      expect.anything(),
      "evt-sop-dup",
    );
  });

  it("routes SOP payload to sop handler on first run", async () => {
    const sopHandler = { handle: vi.fn().mockResolvedValue(undefined) };
    const sopRouter = {
      resolve: vi.fn().mockReturnValue(sopHandler),
    };
    const idempotency = {
      tryBeginRun: vi.fn().mockResolvedValue({ proceed: true, existingRunId: "run-1" }),
      markSucceeded: vi.fn(),
      markFailed: vi.fn(),
    };
    const processor = new PipelineStageProcessorService(
      { resolve: vi.fn() } as never,
      sopRouter as never,
      idempotency as never,
      { markPublished: vi.fn() } as never,
      { handle: vi.fn() } as never,
      { handle: vi.fn() } as never,
    );

    const pool = createMockPool();
    const payload = {
      stage: "sop.media.ocr" as const,
      pipeline_id: "pipe-2",
      step_code: "01-A",
    };

    const outcome = await processor.processStage(
      pool,
      { id: "evt-sop-1" } as never,
      payload,
    );

    expect(outcome).toEqual({ kind: "executed" });
    expect(sopRouter.resolve).toHaveBeenCalledWith("sop.media.ocr");
    expect(sopHandler.handle).toHaveBeenCalledWith(
      expect.objectContaining({ payload }),
    );
  });
});
