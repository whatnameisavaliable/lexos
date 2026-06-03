import { describe, expect, it, vi } from "vitest";
import {
  SOP_ERROR_HANDLER_STAGES,
  SopStageErrorHandler,
} from "./sop-stage-error.handler.js";

describe("SopStageErrorHandler", () => {
  it("marks deep research artifact failed", async () => {
    const artifactRepository = {
      setArtifactStatus: vi.fn().mockResolvedValue(undefined),
    };
    const handler = new SopStageErrorHandler(artifactRepository as never);

    await handler.handle({} as never, {} as never, {
      stage: SOP_ERROR_HANDLER_STAGES.deepResearch,
      pipeline_id: "p1",
      step_code: "02-B",
      artifact_id: "a1",
    }, new Error("fail"));

    expect(artifactRepository.setArtifactStatus).toHaveBeenCalledWith(
      expect.anything(),
      "a1",
      "failed",
    );
  });

  it("does not change artifact on pdf export failure", async () => {
    const artifactRepository = {
      setArtifactStatus: vi.fn(),
    };
    const handler = new SopStageErrorHandler(artifactRepository as never);

    await handler.handle({} as never, {} as never, {
      stage: SOP_ERROR_HANDLER_STAGES.pdfExport,
      pipeline_id: "p1",
      step_code: "03-A",
      artifact_id: "a1",
    }, new Error("pdf fail"));

    expect(artifactRepository.setArtifactStatus).not.toHaveBeenCalled();
  });
});
