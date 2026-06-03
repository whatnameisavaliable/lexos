import { describe, expect, it } from "vitest";
import { deriveHasActiveUpload } from "@/contexts/active-upload-context";

describe("SopMediaUploadZone leave guard", () => {
  it("hasActiveUpload true during sop upload", () => {
    expect(
      deriveHasActiveUpload({
        kind: "sop",
        taskId: "sess",
        fileName: "f.mp3",
        pipelineId: "p1",
        startedAt: 1,
      }),
    ).toBe(true);
  });
});
