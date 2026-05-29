import { describe, expect, it } from "vitest";
import {
  PIPELINE_STAGE_MEDIA_EXTRACT,
  PIPELINE_STAGE_MEDIA_PREPROCESS,
  buildQueuedPayload,
  parseTranscriptionQueuedOutboxPayload,
} from "./transcription-queued-outbox-payload.js";

describe("transcription-queued-outbox-payload", () => {
  it("buildQueuedPayload uses stage as primary field for MP4", () => {
    const payload = buildQueuedPayload({
      taskId: "task-1",
      createdBy: "user-1",
      isMp4: true,
    });
    expect(payload).toEqual({
      stage: PIPELINE_STAGE_MEDIA_EXTRACT,
      queueName: PIPELINE_STAGE_MEDIA_EXTRACT,
      taskId: "task-1",
      createdBy: "user-1",
      isMp4: true,
    });
  });

  it("buildQueuedPayload routes non-MP4 to media.preprocess", () => {
    const payload = buildQueuedPayload({
      taskId: "task-2",
      createdBy: "user-2",
      isMp4: false,
    });
    expect(payload.stage).toBe(PIPELINE_STAGE_MEDIA_PREPROCESS);
    expect(payload.queueName).toBe(PIPELINE_STAGE_MEDIA_PREPROCESS);
  });

  it("parse accepts stage field", () => {
    const parsed = parseTranscriptionQueuedOutboxPayload({
      stage: PIPELINE_STAGE_MEDIA_PREPROCESS,
      taskId: "t1",
      createdBy: "u1",
      isMp4: false,
    });
    expect(parsed.stage).toBe(PIPELINE_STAGE_MEDIA_PREPROCESS);
  });

  it("parse accepts legacy queueName field", () => {
    const parsed = parseTranscriptionQueuedOutboxPayload({
      queueName: PIPELINE_STAGE_MEDIA_EXTRACT,
      taskId: "t1",
      createdBy: "u1",
      isMp4: true,
    });
    expect(parsed.stage).toBe(PIPELINE_STAGE_MEDIA_EXTRACT);
    expect(parsed.queueName).toBe(PIPELINE_STAGE_MEDIA_EXTRACT);
  });

  it("parse rejects unknown stage", () => {
    expect(() =>
      parseTranscriptionQueuedOutboxPayload({
        stage: "unknown",
        taskId: "t1",
        createdBy: "u1",
        isMp4: false,
      }),
    ).toThrow(/Unknown stage/);
  });
});
