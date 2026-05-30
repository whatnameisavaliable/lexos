import path from "node:path";
import { ErrorCode } from "@lexos/shared/api";
import type { WorkerRuntimeEnvConfig } from "@lexos/shared/config";
import type { FfmpegRunner } from "../adapters/ffmpeg/ffmpeg.runner.js";
import type { WorkerStorageAdapter } from "../adapters/storage/worker-storage.adapter.js";

/** MP4 抽音结果。 */
export interface MediaExtractResult {
  readonly audioStorageKey: string;
  readonly localAudioPath: string;
}

/** 抽音失败错误。 */
export class MediaExtractError extends Error {
  constructor(
    message: string,
    readonly code: string = ErrorCode.MEDIA_EXTRACT_FAILED,
  ) {
    super(message);
    this.name = "MediaExtractError";
  }
}

/**
 * MP4 抽音服务：Storage 下载 → FFmpeg 16kHz mono MP3 → 上传 Storage（`architecture.md` §3.2.2.2）。
 */
export class MediaExtractService {
  constructor(
    private readonly env: Pick<
      WorkerRuntimeEnvConfig,
      "ffmpegPath" | "ffmpegTimeoutMs" | "workerTmpDir"
    >,
    private readonly ffmpeg: FfmpegRunner,
    private readonly storage: WorkerStorageAdapter,
    private readonly uploadAudio: (
      localPath: string,
      storageKey: string,
    ) => Promise<void> = defaultUploadAudio,
  ) {}

  /**
   * 从 MP4 源文件抽取音频并返回 Storage 键。
   */
  async extract(input: {
    readonly taskId: string;
    readonly sourceStorageKey: string;
    readonly createdBy: string;
  }): Promise<MediaExtractResult> {
    const taskDir = path.join(this.env.workerTmpDir, input.taskId);
    const sourcePath = path.join(taskDir, "source.mp4");
    const audioPath = path.join(taskDir, "extracted.mp3");
    const audioStorageKey = `${input.createdBy}/${input.taskId}/audio.mp3`;

    try {
      await this.storage.downloadToFile(input.sourceStorageKey, sourcePath);
      const result = await this.ffmpeg.run({
        ffmpegPath: this.env.ffmpegPath,
        timeoutMs: this.env.ffmpegTimeoutMs,
        args: [
          "-y",
          "-i",
          sourcePath,
          "-vn",
          "-acodec",
          "libmp3lame",
          "-ar",
          "16000",
          "-ac",
          "1",
          audioPath,
        ],
      });
      if (result.exitCode !== 0) {
        throw new MediaExtractError(
          `ffmpeg extract failed: ${result.stderr.slice(0, 500)}`,
        );
      }
      await this.uploadAudio(audioPath, audioStorageKey);
      return { audioStorageKey, localAudioPath: audioPath };
    } catch (error) {
      if (error instanceof MediaExtractError) {
        throw error;
      }
      const message = error instanceof Error ? error.message : String(error);
      throw new MediaExtractError(message);
    }
  }
}

async function defaultUploadAudio(
  _localPath: string,
  _storageKey: string,
): Promise<void> {
  throw new Error("uploadAudio dependency not configured");
}
