import { describe, expect, it, vi } from "vitest";
import { ErrorCode } from "@lexos/shared/api";
import { MediaExtractError } from "../services/media-extract.service.js";
import { StageErrorHandler } from "./stage-error.handler.js";

describe("StageErrorHandler", () => {
  it("marks task failed and cleans temp dir", async () => {
    const taskRepository = {
      findById: vi.fn().mockResolvedValue({
        id: "task-1",
        status: "extracting",
      }),
      failTask: vi.fn().mockResolvedValue(undefined),
    };
    const tempDirCleanup = {
      cleanupTaskDir: vi.fn().mockResolvedValue(undefined),
    };
    const handler = new StageErrorHandler(
      taskRepository as never,
      tempDirCleanup as never,
    );

    await handler.handle(
      {} as never,
      { id: "evt-1" } as never,
      {
        stage: "media.extract",
        taskId: "task-1",
        createdBy: "user-1",
        isMp4: true,
      },
      new MediaExtractError("ffmpeg failed"),
    );

    expect(taskRepository.failTask).toHaveBeenCalledWith(
      expect.anything(),
      "task-1",
      "extracting",
      ErrorCode.MEDIA_EXTRACT_FAILED,
      expect.any(String),
    );
    expect(tempDirCleanup.cleanupTaskDir).toHaveBeenCalledWith("task-1");
  });
});
