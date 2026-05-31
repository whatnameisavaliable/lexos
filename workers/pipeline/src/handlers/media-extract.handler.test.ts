import { describe, expect, it, vi } from "vitest";
import { PIPELINE_STAGE_MEDIA_EXTRACT } from "@lexos/shared";
import { createMockPool } from "../test/pg-test-helpers.js";
import { MediaExtractHandler } from "./media-extract.handler.js";

describe("MediaExtractHandler", () => {
  it("extracts audio and completes stage to preprocessing", async () => {
    const mediaExtract = {
      extract: vi.fn().mockResolvedValue({
        audioStorageKey: "user/task/audio.mp3",
        localAudioPath: "/tmp/audio.mp3",
      }),
    };
    const taskRepository = {
      findById: vi.fn().mockResolvedValue({
        id: "task-1",
        sourceStorageKey: "user/task/video.mp4",
        status: "queued",
      }),
      transitionTaskStatus: vi.fn().mockResolvedValue(true),
      updateAudioStorageKey: vi.fn().mockResolvedValue(undefined),
    };
    const transactionService = {
      completeStage: vi.fn().mockResolvedValue(undefined),
    };
    const handler = new MediaExtractHandler(
      mediaExtract as never,
      taskRepository as never,
      transactionService as never,
    );

    await handler.handle({
      pool: createMockPool(),
      event: { id: "evt-1" } as never,
      payload: {
        stage: PIPELINE_STAGE_MEDIA_EXTRACT,
        taskId: "task-1",
        createdBy: "user-1",
        isMp4: true,
      },
    });

    expect(taskRepository.transitionTaskStatus).toHaveBeenCalledWith(
      expect.anything(),
      "task-1",
      "queued",
      "extracting",
    );
    expect(transactionService.completeStage).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        outboxEventId: "evt-1",
        fromStatus: "extracting",
        toStatus: "preprocessing",
      }),
    );
  });
});
