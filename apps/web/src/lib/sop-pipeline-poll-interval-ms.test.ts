import { describe, expect, it } from "vitest";
import { SOP_PIPELINE_POLL_INTERVAL_MS } from "./sop-pipeline-poll-interval-ms.js";

describe("SOP_PIPELINE_POLL_INTERVAL_MS", () => {
  it("is at least 2000ms", () => {
    expect(SOP_PIPELINE_POLL_INTERVAL_MS).toBeGreaterThanOrEqual(2000);
  });
});
