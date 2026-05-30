import { describe, expect, it, vi } from "vitest";
import { createAuthContext } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { DriveNodeGetService } from "./drive-node-get.service.js";

describe("DriveNodeGetService", () => {
  it("throws AUTH_FORBIDDEN for cross-user access", async () => {
    const repo = {
      findById: vi.fn().mockResolvedValue({
        id: "n1",
        createdBy: "other",
        nodeType: "folder",
        name: "docs",
        parentId: "root",
        sizeBytes: null,
        mimeType: null,
        linkedTaskId: null,
        updatedAt: "2024-01-01T00:00:00.000Z",
      }),
    };
    const service = new DriveNodeGetService(repo as never);
    const actor = createAuthContext({
      userId: "u1",
      role: "lawyer",
      username: "l",
      requiresPasswordChange: false,
    });

    await expect(service.get(actor, "token", "n1")).rejects.toMatchObject({
      code: ErrorCode.AUTH_FORBIDDEN,
    });
  });
});
