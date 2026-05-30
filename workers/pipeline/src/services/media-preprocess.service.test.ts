import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { ErrorCode } from "@lexos/shared/api";
import { MediaPreprocessService } from "./media-preprocess.service.js";

describe("MediaPreprocessService", () => {
  let tmpRoot = "";

  beforeEach(async () => {
    tmpRoot = await mkdtemp(path.join(os.tmpdir(), "lexos-preprocess-"));
  });

  afterEach(async () => {
    if (tmpRoot) {
      await rm(tmpRoot, { recursive: true, force: true });
    }
  });

  it("writes segments under WORKER_TMP_DIR and does not upload to storage", async () => {
    const taskId = "task-1";
    const taskDir = path.join(tmpRoot, taskId);
    const ffmpeg = {
      run: vi.fn(async () => {
        await writeFile(path.join(taskDir, "segment_000.mp3"), Buffer.alloc(512));
        await writeFile(path.join(taskDir, "segment_001.mp3"), Buffer.alloc(256));
        return { exitCode: 0, stdout: "", stderr: "" };
      }),
    };
    const storage = {
      downloadToFile: vi.fn().mockResolvedValue(undefined),
    };
    const service = new MediaPreprocessService(
      {
        ffmpegPath: "ffmpeg",
        ffmpegTimeoutMs: 60_000,
        workerTmpDir: tmpRoot,
        asrSegmentDurationSec: 900,
        asrMaxChunkSizeMb: 20,
      },
      ffmpeg as never,
      storage as never,
    );

    const result = await service.preprocess({
      taskId,
      storageKey: "user/task/audio.mp3",
    });

    expect(result.segments).toHaveLength(2);
    expect(result.segments[0]?.localPath).toContain(taskId);
    expect(result.segments[0]?.localPath).toMatch(/segment_000\.mp3$/);
    expect(storage.downloadToFile).toHaveBeenCalled();
  });

  it("throws MEDIA_PREPROCESS_FAILED when segment exceeds max size", async () => {
    const taskId = "task-2";
    const taskDir = path.join(tmpRoot, taskId);
    const ffmpeg = {
      run: vi.fn(async () => {
        await writeFile(
          path.join(taskDir, "segment_000.mp3"),
          Buffer.alloc(21 * 1024 * 1024),
        );
        return { exitCode: 0, stdout: "", stderr: "" };
      }),
    };
    const service = new MediaPreprocessService(
      {
        ffmpegPath: "ffmpeg",
        ffmpegTimeoutMs: 60_000,
        workerTmpDir: tmpRoot,
        asrSegmentDurationSec: 900,
        asrMaxChunkSizeMb: 20,
      },
      ffmpeg as never,
      { downloadToFile: vi.fn() } as never,
    );

    await expect(
      service.preprocess({ taskId, storageKey: "user/task/audio.mp3" }),
    ).rejects.toMatchObject({ code: ErrorCode.MEDIA_PREPROCESS_FAILED });
  });
});
