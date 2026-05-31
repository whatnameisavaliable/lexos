import { describe, expect, it, vi } from "vitest";
import { PIPELINE_STAGE_ASR } from "@lexos/shared";
import { createMockPool } from "../test/pg-test-helpers.js";
import { PipelineStageProcessorService } from "./pipeline-stage-processor.service.js";

describe("PipelineStageProcessorService", () => {
  it("skips duplicate outbox consumption but marks published", async () => {
    const handler = { handle: vi.fn() };
    const router = { resolve: vi.fn().mockReturnValue(handler) };
    const idempotency = {
      tryBeginRun: vi.fn().mockResolvedValue({ proceed: false }),
      markSucceeded: vi.fn(),
      markFailed: vi.fn(),
    };
    const outboxRepository = {
      markPublished: vi.fn().mockResolvedValue(undefined),
    };
    const stageErrorHandler = { handle: vi.fn() };
    const processor = new PipelineStageProcessorService(
      router as never,
      idempotency as never,
      outboxRepository as never,
      stageErrorHandler as never,
    );

    const pool = createMockPool();
    pool.mockClient.query = vi.fn().mockImplementation(async (sql: string) => {
      if (sql.includes("SELECT status, error_message")) {
        return { rows: [{ status: "completed", error_message: null }] };
      }
      return { rows: [], rowCount: 0 };
    }) as never;

    const outcome = await processor.processStage(
      pool,
      { id: "evt-dup" } as never,
      {
        stage: PIPELINE_STAGE_ASR,
        taskId: "task-1",
        createdBy: "user-1",
        isMp4: false,
      },
    );

    expect(outcome).toEqual({ kind: "skipped_duplicate" });
    expect(handler.handle).not.toHaveBeenCalled();
    expect(outboxRepository.markPublished).toHaveBeenCalledWith(
      expect.anything(),
      "evt-dup",
    );
  });
});
