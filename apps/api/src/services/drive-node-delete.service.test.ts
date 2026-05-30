import { describe, expect, it, vi } from "vitest";
import { createAuthContext } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { DriveNodeDeleteService } from "./drive-node-delete.service.js";

describe("DriveNodeDeleteService", () => {
  it("rejects deleting non-empty folder", async () => {
    const repo = {
      findById: vi.fn().mockResolvedValue({
        id: "f1",
        createdBy: "u1",
        nodeType: "folder",
        name: "docs",
        parentId: "root",
      }),
      countActiveChildren: vi.fn().mockResolvedValue(2),
      softDelete: vi.fn(),
    };
    const audit = { append: vi.fn() };
    const service = new DriveNodeDeleteService(repo as never, audit as never);
    const actor = createAuthContext({
      userId: "u1",
      role: "lawyer",
      username: "l",
      requiresPasswordChange: false,
    });

    await expect(service.delete(actor, "token", "f1")).rejects.toMatchObject({
      code: ErrorCode.OPERATION_NOT_ALLOWED,
    });
  });
});
