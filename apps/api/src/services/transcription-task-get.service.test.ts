import { describe, expect, it, vi } from "vitest";
import { createAuthContext } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { TranscriptionTaskGetService } from "./transcription-task-get.service.js";

describe("TranscriptionTaskGetService", () => {
  const taskRepository = { findById: vi.fn() };
  const service = new TranscriptionTaskGetService(taskRepository as never);

  it("returns AUTH_FORBIDDEN when lawyer requests another user's task", async () => {
    taskRepository.findById.mockResolvedValue({
      id: "task-1",
      createdBy: "other-user",
      status: "uploading",
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
});
