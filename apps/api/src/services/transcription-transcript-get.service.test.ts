import { describe, expect, it, vi } from "vitest";
import { createAuthContext } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { TranscriptionTranscriptGetService } from "./transcription-transcript-get.service.js";

describe("TranscriptionTranscriptGetService", () => {
  const taskRepository = { findById: vi.fn() };
  const transcriptRepository = { findByTaskId: vi.fn() };
  const service = new TranscriptionTranscriptGetService(
    taskRepository as never,
    transcriptRepository as never,
  );

  it("returns AUTH_FORBIDDEN when lawyer requests another user's transcript", async () => {
    taskRepository.findById.mockResolvedValue({
      id: "task-1",
      createdBy: "other-user",
      diarizationDegraded: false,
    });

    await expect(
      service.get(
        createAuthContext({
          userId: "user-1",
          role: "lawyer",
          username: "l",
          requiresPasswordChange: false,
        }),
        "token",
        "task-1",
      ),
    ).rejects.toMatchObject({ code: ErrorCode.AUTH_FORBIDDEN });
  });

  it("returns transcript detail with diarizationDegraded when task owner requests it", async () => {
    taskRepository.findById.mockResolvedValue({
      id: "task-1",
      createdBy: "user-1",
      diarizationDegraded: true,
    });
    transcriptRepository.findByTaskId.mockResolvedValue({
      taskId: "task-1",
      polishedText: "hello",
      summaryText: "summary",
      asrRawJson: { segments: [] },
      version: 1,
      updatedAt: "2026-01-01T00:00:00.000Z",
    });

    const result = await service.get(
      createAuthContext({
        userId: "user-1",
        role: "lawyer",
        username: "l",
        requiresPasswordChange: false,
      }),
      "token",
      "task-1",
    );

    expect(result.polishedText).toBe("hello");
    expect(result.diarizationDegraded).toBe(true);
  });
});
