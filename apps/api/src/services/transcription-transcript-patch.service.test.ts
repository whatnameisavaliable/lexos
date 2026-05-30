import { describe, expect, it, vi } from "vitest";
import { createAuthContext } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { TranscriptionTranscriptPatchService } from "./transcription-transcript-patch.service.js";

describe("TranscriptionTranscriptPatchService", () => {
  const taskRepository = { findById: vi.fn() };
  const transcriptRepository = { updatePolishedText: vi.fn() };
  const service = new TranscriptionTranscriptPatchService(
    taskRepository as never,
    transcriptRepository as never,
  );

  it("throws RESOURCE_CONFLICT when optimistic lock fails", async () => {
    taskRepository.findById.mockResolvedValue({
      id: "task-1",
      createdBy: "user-1",
    });
    transcriptRepository.updatePolishedText.mockResolvedValue({
      updated: false,
      record: null,
    });

    await expect(
      service.patch(
        createAuthContext({
          userId: "user-1",
          role: "lawyer",
          username: "l",
          requiresPasswordChange: false,
        }),
        "token",
        "task-1",
        { polishedText: "updated" },
        2,
      ),
    ).rejects.toMatchObject({ code: ErrorCode.RESOURCE_CONFLICT });
  });

  it("returns new version on successful patch", async () => {
    taskRepository.findById.mockResolvedValue({
      id: "task-1",
      createdBy: "user-1",
    });
    transcriptRepository.updatePolishedText.mockResolvedValue({
      updated: true,
      record: {
        taskId: "task-1",
        polishedText: "updated",
        summaryText: null,
        asrRawJson: null,
        version: 3,
        updatedAt: "2026-01-02T00:00:00.000Z",
      },
    });

    const result = await service.patch(
      createAuthContext({
        userId: "user-1",
        role: "lawyer",
        username: "l",
        requiresPasswordChange: false,
      }),
      "token",
      "task-1",
      { polishedText: "updated" },
      2,
    );

    expect(result.version).toBe(3);
  });
});
