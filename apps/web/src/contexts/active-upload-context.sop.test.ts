import { describe, expect, it } from "vitest";
import { deriveHasActiveUpload } from "./active-upload-context.js";

describe("active-upload-context SOP", () => {
  it("hasActiveUpload is true when kind=sop", () => {
    expect(
      deriveHasActiveUpload({
        kind: "sop",
        taskId: null,
        fileName: "case.mp3",
        pipelineId: "00000000-0000-4000-8000-000000000099",
        startedAt: Date.now(),
      }),
    ).toBe(true);
  });

  it("hasActiveUpload is false when cleared", () => {
    expect(deriveHasActiveUpload(null)).toBe(false);
  });
});
