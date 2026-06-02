import { describe, expect, it, vi } from "vitest";
import { createAuthContext } from "@lexos/shared";
import { TranscriptionTaskListService } from "./transcription-task-list.service.js";

describe("TranscriptionTaskListService", () => {
  const taskRepository = {
    listForUser: vi.fn(),
    listAll: vi.fn(),
  };

  const service = new TranscriptionTaskListService(taskRepository as never);

  it("uses listForUser for lawyer", async () => {
    taskRepository.listForUser.mockResolvedValue({
      items: [],
      nextCursor: undefined,
    });

    await service.list(
      createAuthContext({
        userId: "u1",
        role: "lawyer",
        username: "l",
        requiresPasswordChange: false,
      }),
      "token",
      { limit: 50 },
    );

    expect(taskRepository.listForUser).toHaveBeenCalled();
    expect(taskRepository.listAll).not.toHaveBeenCalled();
  });

  it("uses listForUser for admin (no cross-user list)", async () => {
    taskRepository.listForUser.mockResolvedValue({ items: [] });

    await service.list(
      createAuthContext({
        userId: "admin",
        role: "admin",
        username: "admin",
        requiresPasswordChange: false,
      }),
      "token",
      { limit: 50 },
    );

    expect(taskRepository.listForUser).toHaveBeenCalled();
    expect(taskRepository.listAll).not.toHaveBeenCalled();
  });
});
