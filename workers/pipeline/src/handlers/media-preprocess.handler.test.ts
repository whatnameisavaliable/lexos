import { describe, expect, it, vi } from "vitest";
import { PIPELINE_STAGE_MEDIA_PREPROCESS } from "@lexos/shared";
import { createMockPool } from "../test/pg-test-helpers.js";
import { MediaPreprocessHandler } from "./media-preprocess.handler.js";

describe("MediaPreprocessHandler", () => {
  it("preprocesses audio and enqueues asr stage", async () => {
    const mediaPreprocess = {
      preprocess: vi.fn().mockResolvedValue({ segments: [], taskTempDir: "/tmp" }),
    };
    const taskRepository = {
      findById: vi.fn().mockResolvedValue({
        id: "task-1",
        status: "queued",
        audioStorageKey: null,
        sourceStorageKey: "user/task/audio.mp3",
      }),
      transitionTaskStatus: vi.fn().mockResolvedValue(true),
    };
    const transactionService = {
      completeStage: vi.fn().mockResolvedValue(undefined),
    };
    const handler = new MediaPreprocessHandler(
      mediaPreprocess as never,
      taskRepository as never,
      transactionService as never,
    );

    await handler.handle({
      pool: createMockPool(),
      event: { id: "evt-2" } as never,
      payload: {
        stage: PIPELINE_STAGE_MEDIA_PREPROCESS,
        taskId: "task-1",
        createdBy: "user-1",
        isMp4: false,
      },
    });

    expect(mediaPreprocess.preprocess).toHaveBeenCalled();
    expect(transactionService.completeStage).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        fromStatus: "preprocessing",
        toStatus: "asr_running",
      }),
    );
  });
});
