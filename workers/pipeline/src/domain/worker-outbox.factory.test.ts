import { describe, expect, it } from "vitest";
import {
  PIPELINE_STAGE_ASR,
  PIPELINE_STAGE_DRIVE_ARCHIVE,
  PIPELINE_STAGE_LLM,
  PIPELINE_STAGE_MEDIA_EXTRACT,
  PIPELINE_STAGE_MEDIA_PREPROCESS,
} from "@lexos/shared";
import {
  buildInitialStageOutboxRow,
  buildNextStageOutboxRow,
} from "./worker-outbox.factory.js";

describe("worker-outbox.factory", () => {
  it("buildNextStageOutboxRow chains stages", () => {
    const row = buildNextStageOutboxRow({
      currentStage: PIPELINE_STAGE_MEDIA_EXTRACT,
      taskId: "task-1",
      createdBy: "user-1",
      isMp4: true,
    });
    expect(row?.eventType).toBe(`task.stage.${PIPELINE_STAGE_MEDIA_PREPROCESS}`);
    expect(row?.payload).toMatchObject({
      stage: PIPELINE_STAGE_MEDIA_PREPROCESS,
      taskId: "task-1",
    });
  });

  it("returns null after drive.archive", () => {
    expect(
      buildNextStageOutboxRow({
        currentStage: PIPELINE_STAGE_DRIVE_ARCHIVE,
        taskId: "task-1",
        createdBy: "user-1",
        isMp4: false,
      }),
    ).toBeNull();
  });

  it("buildInitialStageOutboxRow routes MP4 to media.extract", () => {
    const row = buildInitialStageOutboxRow({
      taskId: "t1",
      createdBy: "u1",
      isMp4: true,
    });
    expect(row.payload.stage).toBe(PIPELINE_STAGE_MEDIA_EXTRACT);
  });

  it("buildInitialStageOutboxRow routes audio to media.preprocess", () => {
    const row = buildInitialStageOutboxRow({
      taskId: "t1",
      createdBy: "u1",
      isMp4: false,
    });
    expect(row.payload.stage).toBe(PIPELINE_STAGE_MEDIA_PREPROCESS);
  });

  it("full chain from extract to llm", () => {
    const stages = [
      PIPELINE_STAGE_MEDIA_EXTRACT,
      PIPELINE_STAGE_MEDIA_PREPROCESS,
      PIPELINE_STAGE_ASR,
      PIPELINE_STAGE_LLM,
    ] as const;
    for (const stage of stages) {
      const next = buildNextStageOutboxRow({
        currentStage: stage,
        taskId: "t",
        createdBy: "u",
        isMp4: true,
      });
      expect(next).not.toBeNull();
    }
  });
});
