import { describe, expect, it } from "vitest";
import { PIPELINE_STAGE_ASR } from "@lexos/shared";
import { OutboxEventRepository } from "./outbox-event.repository.js";

describe("OutboxEventRepository.parseWorkerPayload", () => {
  const repo = new OutboxEventRepository();

  it("parses SOP deep_research payload", () => {
    const parsed = repo.parseWorkerPayload({
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

  it("parses transcription payload without Invalid taskId", () => {
    const parsed = repo.parseWorkerPayload({
      stage: PIPELINE_STAGE_ASR,
      taskId: "task-1",
      createdBy: "user-1",
      isMp4: false,
    });

    expect(parsed).toMatchObject({
      stage: PIPELINE_STAGE_ASR,
      taskId: "task-1",
    });
  });
});
