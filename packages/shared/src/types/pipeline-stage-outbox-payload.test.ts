import { describe, expect, it } from "vitest";
import { PIPELINE_STAGE_ASR } from "../constants/pipeline-stages.js";
import { parsePipelineStageOutboxPayload } from "./pipeline-stage-outbox-payload.js";

describe("parsePipelineStageOutboxPayload", () => {
  it("accepts all pipeline stages", () => {
    const parsed = parsePipelineStageOutboxPayload({
      stage: PIPELINE_STAGE_ASR,
      taskId: "t1",
      createdBy: "u1",
      isMp4: false,
    });
    expect(parsed.stage).toBe(PIPELINE_STAGE_ASR);
  });

  it("rejects unknown stage", () => {
    expect(() =>
      parsePipelineStageOutboxPayload({
        stage: "unknown",
        taskId: "t1",
        createdBy: "u1",
        isMp4: false,
      }),
    ).toThrow(/Unknown stage/);
  });
});
