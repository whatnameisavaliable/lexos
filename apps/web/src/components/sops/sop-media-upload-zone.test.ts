import { describe, expect, it } from "vitest";
import { buildSopActiveUploadRegister } from "@/hooks/use-sop-tus-upload";

describe("SopMediaUploadZone", () => {
  it("registers sop kind for active upload", () => {
    expect(
      buildSopActiveUploadRegister({
        taskId: null,
        fileName: "f.mp3",
        pipelineId: "p1",
      }).kind,
    ).toBe("sop");
  });
});
