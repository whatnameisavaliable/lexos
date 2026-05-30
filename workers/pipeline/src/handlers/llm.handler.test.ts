import { describe, expect, it, vi } from "vitest";
import { PIPELINE_STAGE_LLM } from "@lexos/shared";
import { LlmHandler } from "./llm.handler.js";

describe("LlmHandler", () => {
  it("polishes and summarizes transcript", async () => {
    const client = {
      query: vi.fn().mockResolvedValue({
        rows: [{ asr_raw_json: { segments: [{ text: "raw" }] } }],
      }),
    };
    const llmTranscript = { polish: vi.fn().mockResolvedValue("polished") };
    const llmSummary = { summarize: vi.fn().mockResolvedValue("summary") };
    const taskRepository = {
      findById: vi.fn().mockResolvedValue({ id: "task-1", status: "llm_running" }),
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
    );

    await handler.handle({
      client: client as never,
      event: { id: "evt-4" } as never,
      payload: {
        stage: PIPELINE_STAGE_LLM,
        taskId: "task-1",
        createdBy: "user-1",
        isMp4: false,
      },
    });

    expect(llmTranscript.polish).toHaveBeenCalledWith(
      client,
      "task-1",
      "raw",
    );
    expect(transcriptRepository.upsertTranscript).toHaveBeenCalledWith(
      client,
      expect.objectContaining({
        polishedText: "polished",
        summaryText: "summary",
      }),
    );
  });
});
