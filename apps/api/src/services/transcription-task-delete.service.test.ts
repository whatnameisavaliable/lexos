import { describe, expect, it, vi } from "vitest";
import { createAuthContext } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { TranscriptionTaskDeleteService } from "./transcription-task-delete.service.js";

describe("TranscriptionTaskDeleteService", () => {
  const taskRepository = { findById: vi.fn(), softDelete: vi.fn() };
  const auditLogRepository = { append: vi.fn() };
  const service = new TranscriptionTaskDeleteService(
    taskRepository as never,
    auditLogRepository as never,
  );

  it("rejects delete for in-progress task", async () => {
    taskRepository.findById.mockResolvedValue({
      id: "task-1",
      createdBy: "user-1",
      status: "asr_running",
    });

    await expect(
      service.delete(
        createAuthContext({
          userId: "user-1",
          role: "lawyer",
          username: "l",
          requiresPasswordChange: false,
        }),
        "token",
        "task-1",
      ),
    ).rejects.toMatchObject({ code: ErrorCode.TASK_INVALID_STATE });
  });

  it("soft deletes completed task and writes file.delete audit", async () => {
    taskRepository.findById.mockResolvedValue({
      id: "task-1",
      createdBy: "user-1",
      status: "completed",
    });
    taskRepository.softDelete.mockResolvedValue({
      id: "task-1",
      status: "completed",
      deletedAt: "2026-01-01T00:00:00.000Z",
    });

    const result = await service.delete(
      createAuthContext({
        userId: "user-1",
        role: "lawyer",
        username: "l",
        requiresPasswordChange: false,
      }),
      "token",
      "task-1",
    );

    expect(result.id).toBe("task-1");
    expect(auditLogRepository.append).toHaveBeenCalledWith(
      expect.objectContaining({ action: "file.delete", targetId: "task-1" }),
    );
  });
});
