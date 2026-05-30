import { describe, expect, it, vi } from "vitest";
import { AsrRateLimiter } from "../infra/asr-rate-limiter.js";
import { AsrSegmentRunnerService } from "./asr-segment-runner.service.js";

describe("AsrSegmentRunnerService", () => {
  it("runs segments with concurrency limit and merges asr_raw_json", async () => {
    let active = 0;
    let maxActive = 0;
    const aiOrchestration = {
      invoke: vi.fn(async () => {
        active += 1;
        maxActive = Math.max(maxActive, active);
        await new Promise((r) => setTimeout(r, 10));
        active -= 1;
        return { text: "x", modelId: "m1", isFallback: false, latencyMs: 1 };
      }),
    };
    const segmentRepository = {
      upsertTaskSegments: vi.fn().mockResolvedValue(2),
    };
    const service = new AsrSegmentRunnerService(
      aiOrchestration as never,
      segmentRepository as never,
      2,
      new AsrRateLimiter(1000),
    );

    const result = await service.run({} as never, "task-1", [
      { segmentIndex: 0, localPath: "/tmp/0.mp3", startMs: 0, endMs: 1, chunkSizeBytes: 1 },
      { segmentIndex: 1, localPath: "/tmp/1.mp3", startMs: 1, endMs: 2, chunkSizeBytes: 1 },
      { segmentIndex: 2, localPath: "/tmp/2.mp3", startMs: 2, endMs: 3, chunkSizeBytes: 1 },
    ]);

    expect(result.asrRawJson.segments).toHaveLength(3);
    expect(maxActive).toBeLessThanOrEqual(2);
    expect(result.diarizationDegraded).toBe(true);
  });
});
