import pLimit from "p-limit";
import type { PoolClient } from "pg";
import { AiFeatureKey } from "@lexos/shared";
import type { AsrRateLimiter } from "../infra/asr-rate-limiter.js";
import { WorkerAiRepository } from "../repositories/worker-ai.repository.js";
import { WorkerSegmentRepository } from "../repositories/worker-segment.repository.js";
import type { PreprocessSegmentFile } from "./media-preprocess.service.js";
import type { AiOrchestrationService } from "./ai-orchestration.service.js";

/** ASR 合并后的 raw JSON 结构。 */
export interface AsrRawJson {
  readonly segments: ReadonlyArray<{
    readonly segmentIndex: number;
    readonly startMs: number;
    readonly endMs: number;
    readonly text: string;
    readonly speakerLabel?: string | null;
  }>;
}

/** ASR 编排结果。 */
export interface AsrSegmentRunnerResult {
  readonly asrRawJson: AsrRawJson;
  readonly diarizationDegraded: boolean;
}

/**
 * 单任务 ASR 切片并发执行（`ASR_API_CONCURRENCY=3`）并合并结果。
 */
export class AsrSegmentRunnerService {
  private readonly segmentLimit;

  constructor(
    private readonly aiOrchestration: AiOrchestrationService,
    private readonly segmentRepository: WorkerSegmentRepository,
    asrApiConcurrency: number,
    private readonly rateLimiter: AsrRateLimiter,
  ) {
    this.segmentLimit = pLimit(asrApiConcurrency);
  }

  async run(
    client: PoolClient,
    taskId: string,
    segments: readonly PreprocessSegmentFile[],
  ): Promise<AsrSegmentRunnerResult> {
    let diarizationDegraded = false;
    const results = await Promise.all(
      segments.map((segment) =>
        this.segmentLimit(async () => {
          await this.rateLimiter.acquire();
          const idempotencyKey = WorkerAiRepository.buildIdempotencyKey([
            taskId,
            AiFeatureKey.ASR_PHYSICAL,
            String(segment.segmentIndex),
            "1",
          ]);
          const asr = await this.aiOrchestration.invoke({
            client,
            taskId,
            featureKey: AiFeatureKey.ASR_PHYSICAL,
            idempotencyKey,
            transcribePath: segment.localPath,
          });
          diarizationDegraded = true;
          return {
            segmentIndex: segment.segmentIndex,
            startMs: segment.startMs,
            endMs: segment.endMs,
            text: asr.text,
            speakerLabel: null as string | null,
          };
        }),
      ),
    );

    await this.segmentRepository.upsertTaskSegments(
      client,
      taskId,
      results.map((item) => ({
        segmentIndex: item.segmentIndex,
        startMs: item.startMs,
        endMs: item.endMs,
        asrText: item.text,
        speakerLabel: item.speakerLabel,
        status: "done",
      })),
    );

    return {
      asrRawJson: { segments: results },
      diarizationDegraded,
    };
  }
}
