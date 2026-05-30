import { describe, expect, it, vi } from "vitest";
import { PIPELINE_STAGE_ASR } from "@lexos/shared";
import { AsrHandler } from "./asr.handler.js";

describe("AsrHandler", () => {
  it("runs asr on prepared segments and enqueues llm", async () => {
    const asrRunner = {
      run: vi.fn().mockResolvedValue({
        asrRawJson: { segments: [{ segmentIndex: 0, text: "hi" }] },
        diarizationDegraded: true,
      }),
    };
    const mediaPreprocess = {
      loadPreparedSegments: vi.fn().mockResolvedValue([
        { segmentIndex: 0, localPath: "/tmp/seg.mp3", startMs: 0, endMs: 1000 },
      ]),
    };
    const taskRepository = {
      findById: vi.fn().mockResolvedValue({ id: "task-1", status: "asr_running" }),
      updateDiarizationDegraded: vi.fn().mockResolvedValue(undefined),
    };
    const transcriptRepository = {
      upsertTranscript: vi.fn().mockResolvedValue(undefined),
    };
    const transactionService = {
      completeStage: vi.fn().mockResolvedValue(undefined),
    };
    const handler = new AsrHandler(
      asrRunner as never,
      mediaPreprocess as never,
      taskRepository as never,
      transcriptRepository as never,
      transactionService as never,
    );

    await handler.handle({
      client: {} as never,
      event: { id: "evt-3" } as never,
      payload: {
        stage: PIPELINE_STAGE_ASR,
        taskId: "task-1",
        createdBy: "user-1",
        isMp4: false,
      },
    });

    expect(asrRunner.run).toHaveBeenCalled();
    expect(taskRepository.updateDiarizationDegraded).toHaveBeenCalledWith(
      expect.anything(),
      "task-1",
      true,
    );
  });
});
