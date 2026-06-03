import { describe, expect, it, vi } from "vitest";
import { PIPELINE_STAGE_LLM } from "@lexos/shared";
import { createMockPool } from "../test/pg-test-helpers.js";
import { LlmHandler } from "./llm.handler.js";

describe("LlmHandler", () => {
  it("polishes and summarizes transcript", async () => {
    const pool = createMockPool();
    pool.mockClient.query = vi.fn().mockResolvedValue({
      rows: [{ asr_raw_json: { segments: [{ text: "raw" }] } }],
    }) as never;

    const llmTranscript = { polish: vi.fn().mockResolvedValue("polished") };
    const llmSummary = { summarize: vi.fn().mockResolvedValue("summary") };
    const taskRepository = {
      findById: vi.fn().mockResolvedValue({ id: "task-1", status: "llm_running" }),
      updateLlmOutcomeFlags: vi.fn().mockResolvedValue(undefined),
      clearTaskError: vi.fn().mockResolvedValue(undefined),
    };
    const transcriptRepository = {
      upsertTranscript: vi.fn().mockResolvedValue(undefined),
    };
    const transactionService = {
      completeStage: vi.fn().mockResolvedValue(undefined),
    };
    const handler = new LlmHandler(
      llmTranscript as never,
      llmSummary as never,
      taskRepository as never,
      transcriptRepository as never,
      transactionService as never,
      { cleanupTaskDir: vi.fn() } as never,
    );

    await handler.handle({
      pool,
      event: { id: "evt-4" } as never,
      payload: {
        stage: PIPELINE_STAGE_LLM,
        taskId: "task-1",
        createdBy: "user-1",
        isMp4: false,
      },
    });

    expect(llmTranscript.polish).toHaveBeenCalledWith(pool, "task-1", "raw");
    expect(transcriptRepository.upsertTranscript).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        polishedText: "polished",
        summaryText: "summary",
      }),
    );
  });
});
