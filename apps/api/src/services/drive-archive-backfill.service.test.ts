import { describe, expect, it, vi } from "vitest";
import { createAuthContext } from "@lexos/shared";
import { DriveArchiveBackfillService } from "./drive-archive-backfill.service.js";

describe("DriveArchiveBackfillService", () => {
  it("creates audio and transcript file refs for archive folder", async () => {
    const driveRepo = {
      findById: vi.fn().mockResolvedValue({
        id: "folder-1",
        nodeType: "folder",
        linkedTaskId: "task-1",
        createdBy: "u1",
      }),
      findFileByStorageKeyInParent: vi.fn().mockResolvedValue(null),
      findFileByNameInParent: vi.fn().mockResolvedValue(null),
      createFile: vi.fn().mockResolvedValue({ id: "file-1" }),
    };
    const taskRepo = {
      findById: vi.fn().mockResolvedValue({
        id: "task-1",
        status: "completed",
        createdBy: "u1",
        title: "客户录音",
        audioStorageKey: "u1/task-1/audio.mp3",
        sourceStorageKey: "u1/task-1/source.mp3",
        sizeBytes: 1024,
      }),
    };
    const transcriptRepo = {
      findByTaskId: vi.fn().mockResolvedValue({
        polishedText: "<p>合同违约</p>",
        summaryText: "摘要",
        asrRawJson: null,
      }),
    };
    const storage = {
      uploadObject: vi.fn().mockResolvedValue(undefined),
    };

    const service = new DriveArchiveBackfillService(
      driveRepo as never,
      taskRepo as never,
      transcriptRepo as never,
      storage as never,
    );
    const actor = createAuthContext({
      userId: "u1",
      role: "lawyer",
      username: "l",
      requiresPasswordChange: false,
    });

    await service.ensureArchiveFilesForFolder(actor, "token", "folder-1");

    expect(driveRepo.createFile).toHaveBeenCalledTimes(2);
    expect(storage.uploadObject).toHaveBeenCalledTimes(1);
  });
});
