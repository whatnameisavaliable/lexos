import { describe, expect, it } from "vitest";
import { PIPELINE_STAGE_MEDIA_EXTRACT } from "../constants/pipeline-stages.js";
import { parseWorkerOutboxPayload } from "./parse-worker-outbox-payload.js";

describe("parseWorkerOutboxPayload", () => {
  it("parses transcription media.extract payload", () => {
    const parsed = parseWorkerOutboxPayload({
      stage: PIPELINE_STAGE_MEDIA_EXTRACT,
      taskId: "task-1",
      createdBy: "user-1",
      isMp4: true,
    });

    expect(parsed).toMatchObject({
      stage: PIPELINE_STAGE_MEDIA_EXTRACT,
      taskId: "task-1",
      createdBy: "user-1",
      isMp4: true,
    });
  });

  it("parses SOP deep_research payload via SOP branch", () => {
    const parsed = parseWorkerOutboxPayload({
      stage: "sop.deep_research",
      pipeline_id: "pipe-1",
      step_code: "02-B",
      artifact_id: "art-1",
    });

    expect(parsed).toMatchObject({
      stage: "sop.deep_research",
      pipeline_id: "pipe-1",
      step_code: "02-B",
      artifact_id: "art-1",
    });
  });
});
