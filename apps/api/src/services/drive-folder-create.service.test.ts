import { describe, expect, it, vi } from "vitest";
import { createAuthContext } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { DriveFolderCreateService } from "./drive-folder-create.service.js";

describe("DriveFolderCreateService", () => {
  it("maps duplicate folder name to VALIDATION_FAILED", async () => {
    const repo = {
      findById: vi.fn().mockResolvedValue({
        id: "p1",
        createdBy: "u1",
        nodeType: "folder",
      }),
      createFolder: vi
        .fn()
        .mockRejectedValue(new Error("duplicate key drive_nodes_created_by_parent_name_uidx")),
    };
    const service = new DriveFolderCreateService(repo as never);
    const actor = createAuthContext({
      userId: "u1",
      role: "lawyer",
      username: "l",
      requiresPasswordChange: false,
    });

    await expect(
      service.create(actor, "token", { parentId: "p1", name: "资料" }),
    ).rejects.toMatchObject({ code: ErrorCode.VALIDATION_FAILED });
  });
});
