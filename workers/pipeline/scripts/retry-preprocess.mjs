/**
 * 本地验证：对最近失败任务重跑 media.preprocess（需 worker 已修复 + .env.development）。
 * 用法：node workers/pipeline/scripts/retry-preprocess.mjs [taskId]
 */
import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  loadStorageRuntimeEnvFromProcess,
  loadWorkerRuntimeEnvFromProcess,
} from "@lexos/shared/config";
import { FfmpegRunner } from "../src/adapters/ffmpeg/ffmpeg.runner.js";
import { WorkerStorageAdapter } from "../src/adapters/storage/worker-storage.adapter.js";
import { MediaPreprocessService } from "../src/services/media-preprocess.service.js";
import { assertFfmpegArgsAllowed } from "../src/adapters/ffmpeg/ffmpeg.runner.js";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);
config({ path: path.join(repoRoot, ".env.development"), override: true });

const taskId =
  process.argv[2] ?? "4f554dde-a326-45d7-9c7a-53d034b7093c";
const storageKey = `613487bb-6682-4ce0-946c-1879c44b4f4e/${taskId}/__.m4a`;
const segmentPattern = `D:\\tmp\\lexos\\${taskId}\\segment_%03d.mp3`;

console.log("assert segment path...");
assertFfmpegArgsAllowed(["-i", "D:\\tmp\\lexos\\x\\source_audio", segmentPattern]);
console.log("assert ok");

const env = loadWorkerRuntimeEnvFromProcess();
const storageEnv = loadStorageRuntimeEnvFromProcess();
const service = new MediaPreprocessService(
  env,
  new FfmpegRunner(env.ffmpegMaxConcurrent),
  new WorkerStorageAdapter(env, storageEnv),
);

console.log("preprocess", taskId, storageKey);
const result = await service.preprocess({ taskId, storageKey });
console.log("success segments=", result.segments.length, result.taskTempDir);
