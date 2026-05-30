import { describe, expect, it, vi } from "vitest";
import { ErrorCode } from "@lexos/shared/api";
import {
  MediaExtractError,
  MediaExtractService,
} from "./media-extract.service.js";

describe("MediaExtractService", () => {
  const env = {
    ffmpegPath: "ffmpeg",
    ffmpegTimeoutMs: 60_000,
    workerTmpDir: "/tmp/lexos",
  };

  it("extracts audio and uploads to storage key", async () => {
    const ffmpeg = {
      run: vi.fn().mockResolvedValue({ exitCode: 0, stdout: "", stderr: "" }),
    };
    const storage = {
      downloadToFile: vi.fn().mockResolvedValue(undefined),
    };
    const uploadAudio = vi.fn().mockResolvedValue(undefined);
    const service = new MediaExtractService(
      env,
      ffmpeg as never,
      storage as never,
      uploadAudio,
    );

    const result = await service.extract({
      taskId: "task-1",
      sourceStorageKey: "user/task/video.mp4",
      createdBy: "user-1",
    });

    expect(result.audioStorageKey).toBe("user-1/task-1/audio.mp3");
    expect(ffmpeg.run).toHaveBeenCalledWith(
      expect.objectContaining({
        args: expect.arrayContaining(["-ar", "16000", "-ac", "1"]),
      }),
    );
    expect(uploadAudio).toHaveBeenCalled();
  });

  it("throws MEDIA_EXTRACT_FAILED when ffmpeg exits non-zero", async () => {
    const service = new MediaExtractService(
      env,
      {
        run: vi.fn().mockResolvedValue({ exitCode: 1, stdout: "", stderr: "fail" }),
      } as never,
      { downloadToFile: vi.fn() } as never,
      vi.fn(),
    );

    await expect(
      service.extract({
        taskId: "task-1",
        sourceStorageKey: "user/task/video.mp4",
        createdBy: "user-1",
      }),
    ).rejects.toMatchObject({
      code: ErrorCode.MEDIA_EXTRACT_FAILED,
    } satisfies Partial<MediaExtractError>);
  });
});
