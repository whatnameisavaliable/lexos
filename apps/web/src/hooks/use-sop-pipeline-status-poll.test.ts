import { describe, expect, it, vi, afterEach } from "vitest";
import { SOP_PIPELINE_POLL_INTERVAL_MS } from "@/lib/sop-pipeline-poll-interval-ms";
import { startSopPipelineStatusPollInterval } from "./use-sop-pipeline-status-poll.js";

describe("startSopPipelineStatusPollInterval", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("calls tick at least twice when interval elapses >=2000ms", () => {
    vi.useFakeTimers();
    const tick = vi.fn();
    const stop = startSopPipelineStatusPollInterval({
      tick,
      intervalMs: SOP_PIPELINE_POLL_INTERVAL_MS,
    });
    vi.advanceTimersByTime(SOP_PIPELINE_POLL_INTERVAL_MS);
    vi.advanceTimersByTime(SOP_PIPELINE_POLL_INTERVAL_MS);
    stop();
    expect(tick.mock.calls.length).toBeGreaterThanOrEqual(2);
  });
});
