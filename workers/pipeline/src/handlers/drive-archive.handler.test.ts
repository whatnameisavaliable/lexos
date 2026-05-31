import { describe, expect, it, vi } from "vitest";
import { createMockPool } from "../test/pg-test-helpers.js";
import { PIPELINE_STAGE_DRIVE_ARCHIVE } from "@lexos/shared";
import { DriveArchiveHandler } from "./drive-archive.handler.js";

describe("DriveArchiveHandler", () => {
  it("creates archive folder and completes task", async () => {
    const driveRepository = {
      createArchiveFolder: vi.fn().mockResolvedValue("folder-1"),
      ensureArchiveFileRef: vi.fn().mockResolvedValue(undefined),
    };
    const taskRepository = {
      findById: vi.fn().mockResolvedValue({
        id: "task-1",
        status: "llm_running",
        title: "Case A",
        audioStorageKey: "u1/task-1/audio.mp3",
        sourceStorageKey: "u1/task-1/source.mp3",
        sizeBytes: "4096",
      }),
      setArchiveFolderId: vi.fn().mockResolvedValue(undefined),
    };
    const transactionService = {
      completeStage: vi.fn().mockResolvedValue(undefined),
    };
    const auditAdapter = {
      appendTaskComplete: vi.fn().mockResolvedValue(undefined),
    };
    const tempDirCleanup = {
      cleanupTaskDir: vi.fn().mockResolvedValue(undefined),
    };
    const handler = new DriveArchiveHandler(
      driveRepository as never,
      taskRepository as never,
      transactionService as never,
      auditAdapter as never,
      tempDirCleanup as never,
    );

    await handler.handle({
      pool: createMockPool(),
      event: { id: "evt-5" } as never,
      payload: {
        stage: PIPELINE_STAGE_DRIVE_ARCHIVE,
        taskId: "task-1",
        createdBy: "user-1",
        isMp4: false,
      },
    });

    expect(transactionService.completeStage).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        fromStatus: "llm_running",
        toStatus: "completed",
        nextOutbox: null,
      }),
    );
    expect(tempDirCleanup.cleanupTaskDir).toHaveBeenCalledWith("task-1");
  });
});
