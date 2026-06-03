import { describe, expect, it } from "vitest";
import { buildSopActiveUploadRegister } from "./use-sop-tus-upload.js";

describe("useSopTusUpload", () => {
  it("registers kind=sop with pipelineId", () => {
    expect(
      buildSopActiveUploadRegister({
        taskId: null,
        fileName: "a.mp3",
        pipelineId: "00000000-0000-4000-8000-000000000001",
      }),
    ).toEqual({
      kind: "sop",
      taskId: null,
      fileName: "a.mp3",
      pipelineId: "00000000-0000-4000-8000-000000000001",
    });
  });
});
