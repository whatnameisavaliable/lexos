import {
  PIPELINE_STAGE_ASR,
  PIPELINE_STAGE_DRIVE_ARCHIVE,
  PIPELINE_STAGE_LLM,
  PIPELINE_STAGE_MEDIA_EXTRACT,
  PIPELINE_STAGE_MEDIA_PREPROCESS,
} from "@lexos/shared";
import {
  loadAiRuntimeEnvFromProcess,
  loadStorageRuntimeEnvFromProcess,
  type WorkerRuntimeEnvConfig,
} from "@lexos/shared/config";
import { FfmpegRunner } from "../adapters/ffmpeg/ffmpeg.runner.js";
import { RoutingWorkerAiClient } from "../adapters/ai/routing-worker-ai.client.js";
import { WorkerAuditAdapter } from "../adapters/audit/worker-audit.adapter.js";
import { WorkerStorageAdapter } from "../adapters/storage/worker-storage.adapter.js";
import { AsrHandler } from "../handlers/asr.handler.js";
import { DriveArchiveHandler } from "../handlers/drive-archive.handler.js";
import { LlmHandler } from "../handlers/llm.handler.js";
import { MediaExtractHandler } from "../handlers/media-extract.handler.js";
import { MediaPreprocessHandler } from "../handlers/media-preprocess.handler.js";
import { StageErrorHandler } from "../handlers/stage-error.handler.js";
import { createAsrRateLimiter } from "../infra/asr-rate-limiter.js";
import { WorkerAiRepository } from "../repositories/worker-ai.repository.js";
import { WorkerDriveRepository } from "../repositories/worker-drive.repository.js";
import { WorkerSegmentRepository } from "../repositories/worker-segment.repository.js";
import { WorkerTaskRepository } from "../repositories/worker-task.repository.js";
import { WorkerTranscriptRepository } from "../repositories/worker-transcript.repository.js";
import { AiOrchestrationService } from "../services/ai-orchestration.service.js";
import { AsrSegmentRunnerService } from "../services/asr-segment-runner.service.js";
import { LlmSummaryService } from "../services/llm-summary.service.js";
import { LlmTranscriptService } from "../services/llm-transcript.service.js";
import { MediaExtractService } from "../services/media-extract.service.js";
import { MediaPreprocessService } from "../services/media-preprocess.service.js";
import { PipelineStageProcessorService } from "../services/pipeline-stage-processor.service.js";
import type { OutboxStageProcessor } from "../services/outbox-stage-processor.js";
import { StageRouter } from "../services/stage-router.js";
import { TempDirCleanupService } from "../services/temp-dir-cleanup.service.js";
import { WorkerTransactionService } from "../services/worker-transaction.service.js";
import type { WorkerAiClient } from "../adapters/ai/worker-ai-client.port.js";

const DEFAULT_ASR_API_CONCURRENCY = 3;
const DEFAULT_ASR_REQUEST_TIMEOUT_MS = 120_000;

/** 可注入依赖（集成测试 Mock AI 等）。 */
export interface CreatePipelineDepsOverrides {
  readonly aiClient?: WorkerAiClient;
}

/**
 * 装配 U3 流水线依赖：Handler 路由 + 阶段处理器。
 */
export function createPipelineStageProcessor(
  env: WorkerRuntimeEnvConfig,
  overrides: CreatePipelineDepsOverrides = {},
): OutboxStageProcessor {
  const aiEnv = loadAiRuntimeEnvFromProcess();
  const storageEnv = loadStorageRuntimeEnvFromProcess();
  const ffmpeg = new FfmpegRunner(env.ffmpegMaxConcurrent);
  const storage = new WorkerStorageAdapter(env, storageEnv);
  const taskRepository = new WorkerTaskRepository();
  const transactionService = new WorkerTransactionService();
  const tempDirCleanup = new TempDirCleanupService(env.workerTmpDir);
  const stageErrorHandler = new StageErrorHandler(
    taskRepository,
    tempDirCleanup,
  );

  const mediaExtract = new MediaExtractService(
    env,
    ffmpeg,
    storage,
    (localPath, storageKey) => storage.uploadFile(localPath, storageKey),
  );
  const mediaPreprocess = new MediaPreprocessService(env, ffmpeg, storage);

  const aiRepository = new WorkerAiRepository(env, aiEnv);
  const aiClient =
    overrides.aiClient ?? new RoutingWorkerAiClient(storage);
  const aiOrchestration = new AiOrchestrationService(
    aiRepository,
    aiClient,
    DEFAULT_ASR_REQUEST_TIMEOUT_MS,
  );
  const asrRunner = new AsrSegmentRunnerService(
    aiOrchestration,
    new WorkerSegmentRepository(),
    parseAsrApiConcurrency(),
    createAsrRateLimiter(env.asrRateLimitMax),
  );
  const llmTranscript = new LlmTranscriptService(aiOrchestration);
  const llmSummary = new LlmSummaryService(aiOrchestration);

  const router = new StageRouter({
    [PIPELINE_STAGE_MEDIA_EXTRACT]: new MediaExtractHandler(
      mediaExtract,
      storage,
      taskRepository,
      transactionService,
    ),
    [PIPELINE_STAGE_MEDIA_PREPROCESS]: new MediaPreprocessHandler(
      mediaPreprocess,
      taskRepository,
      transactionService,
    ),
    [PIPELINE_STAGE_ASR]: new AsrHandler(
      asrRunner,
      mediaPreprocess,
      taskRepository,
      new WorkerTranscriptRepository(),
      transactionService,
    ),
    [PIPELINE_STAGE_LLM]: new LlmHandler(
      llmTranscript,
      llmSummary,
      taskRepository,
      new WorkerTranscriptRepository(),
      transactionService,
      tempDirCleanup,
    ),
    [PIPELINE_STAGE_DRIVE_ARCHIVE]: new DriveArchiveHandler(
      new WorkerDriveRepository(),
      taskRepository,
      transactionService,
      new WorkerAuditAdapter(env),
      tempDirCleanup,
    ),
  });

  return new PipelineStageProcessorService(router, undefined, undefined, stageErrorHandler);
}

function parseAsrApiConcurrency(): number {
  const raw = process.env.ASR_API_CONCURRENCY?.trim();
  if (!raw) {
    return DEFAULT_ASR_API_CONCURRENCY;
  }
  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`Invalid ASR_API_CONCURRENCY: ${raw}`);
  }
  return value;
}
