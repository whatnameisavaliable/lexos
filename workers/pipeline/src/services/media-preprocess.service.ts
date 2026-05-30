import { mkdir, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { ErrorCode } from "@lexos/shared/api";
import type { WorkerRuntimeEnvConfig } from "@lexos/shared/config";
import type { FfmpegRunner } from "../adapters/ffmpeg/ffmpeg.runner.js";
import type { WorkerStorageAdapter } from "../adapters/storage/worker-storage.adapter.js";

/** 预处理切片描述。 */
export interface PreprocessSegmentFile {
  readonly segmentIndex: number;
  readonly localPath: string;
  readonly startMs: number;
  readonly endMs: number;
  readonly chunkSizeBytes: number;
}

/** 预处理结果。 */
export interface MediaPreprocessResult {
  readonly segments: readonly PreprocessSegmentFile[];
  readonly taskTempDir: string;
}

/** 预处理失败错误。 */
export class MediaPreprocessError extends Error {
  constructor(
    message: string,
    readonly code: string = ErrorCode.MEDIA_PREPROCESS_FAILED,
  ) {
    super(message);
    this.name = "MediaPreprocessError";
  }
}

/**
 * 音频预处理：Storage 流式落盘 → 重采样 → 物理切片（`architecture.md` §3.2.2.3）。
 * 切片 **仅** 写入 `WORKER_TMP_DIR/{taskId}/`，禁止上传 Storage。
 */
export class MediaPreprocessService {
  constructor(
    private readonly env: Pick<
      WorkerRuntimeEnvConfig,
      | "ffmpegPath"
      | "ffmpegTimeoutMs"
      | "workerTmpDir"
      | "asrSegmentDurationSec"
      | "asrMaxChunkSizeMb"
    >,
    private readonly ffmpeg: FfmpegRunner,
    private readonly storage: WorkerStorageAdapter,
  ) {}

  /**
   * 下载源/抽音文件并切片至本地临时目录。
   */
  async preprocess(input: {
    readonly taskId: string;
    readonly storageKey: string;
  }): Promise<MediaPreprocessResult> {
    const taskTempDir = path.join(this.env.workerTmpDir, input.taskId);
    const sourcePath = path.join(taskTempDir, "source_audio");
    const segmentPattern = path.join(taskTempDir, "segment_%03d.mp3");

    try {
      await mkdir(taskTempDir, { recursive: true });
      await this.storage.downloadToFile(input.storageKey, sourcePath);
      const result = await this.ffmpeg.run({
        ffmpegPath: this.env.ffmpegPath,
        timeoutMs: this.env.ffmpegTimeoutMs,
        args: [
          "-y",
          "-i",
          sourcePath,
          "-ar",
          "16000",
          "-ac",
          "1",
          "-f",
          "segment",
          "-segment_time",
          String(this.env.asrSegmentDurationSec),
          "-reset_timestamps",
          "1",
          segmentPattern,
        ],
      });
      if (result.exitCode !== 0) {
        throw new MediaPreprocessError(
          `ffmpeg preprocess failed: ${result.stderr.slice(0, 500)}`,
        );
      }

      const files = (await readdir(taskTempDir))
        .filter((name) => name.startsWith("segment_") && name.endsWith(".mp3"))
        .sort();

      const maxBytes = this.env.asrMaxChunkSizeMb * 1024 * 1024;
      const segments: PreprocessSegmentFile[] = [];
      for (let index = 0; index < files.length; index += 1) {
        const fileName = files[index]!;
        const localPath = path.join(taskTempDir, fileName);
        const fileStat = await stat(localPath);
        if (fileStat.size > maxBytes) {
          throw new MediaPreprocessError(
            `segment ${fileName} exceeds ASR_MAX_CHUNK_SIZE_MB`,
          );
        }
        const startMs = index * this.env.asrSegmentDurationSec * 1000;
        const endMs = startMs + this.env.asrSegmentDurationSec * 1000;
        segments.push({
          segmentIndex: index,
          localPath,
          startMs,
          endMs,
          chunkSizeBytes: fileStat.size,
        });
      }

      return { segments, taskTempDir };
    } catch (error) {
      if (error instanceof MediaPreprocessError) {
        throw error;
      }
      const message = error instanceof Error ? error.message : String(error);
      throw new MediaPreprocessError(message);
    }
  }
}
