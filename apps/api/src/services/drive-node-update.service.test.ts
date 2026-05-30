import { describe, expect, it, vi } from "vitest";
import { createAuthContext } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { DriveNodeUpdateService } from "./drive-node-update.service.js";

describe("DriveNodeUpdateService", () => {
  it("rejects moving folder into its own subtree", async () => {
    const repo = {
      findById: vi
        .fn()
        .mockResolvedValueOnce({
          id: "folder-a",
          createdBy: "u1",
          nodeType: "folder",
          name: "A",
          parentId: "root",
        })
        .mockResolvedValueOnce({
          id: "folder-b",
          createdBy: "u1",
          nodeType: "folder",
          name: "B",
          parentId: "folder-a",
        }),
      listAncestorIds: vi.fn().mockResolvedValue(["folder-b", "folder-a", "root"]),
      updateNode: vi.fn(),
    };
    const service = new DriveNodeUpdateService(repo as never);
    const actor = createAuthContext({
      userId: "u1",
      role: "lawyer",
      username: "l",
      requiresPasswordChange: false,
    });

    await expect(
      service.update(actor, "token", "folder-a", { parentId: "folder-b" }),
    ).rejects.toMatchObject({ code: ErrorCode.VALIDATION_FAILED });
  });
});
