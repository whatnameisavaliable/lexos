import { describe, expect, it, vi, afterEach } from "vitest";
import { SOP_PIPELINE_POLL_INTERVAL_MS } from "@/lib/sop-pipeline-poll-interval-ms";
import { startSopPipelineStatusPollInterval } from "@/hooks/use-sop-pipeline-status-poll";

describe("LawyerSopPipelineWorkspace running poll", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("poll tick runs at least twice while running", () => {
    vi.useFakeTimers();
    const tick = vi.fn();
    const stop = startSopPipelineStatusPollInterval({
      tick,
      intervalMs: SOP_PIPELINE_POLL_INTERVAL_MS,
    });
    vi.advanceTimersByTime(SOP_PIPELINE_POLL_INTERVAL_MS * 2);
    stop();
    expect(tick.mock.calls.length).toBeGreaterThanOrEqual(2);
  });
});
