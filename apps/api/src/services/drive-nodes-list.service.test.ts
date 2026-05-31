import { describe, expect, it, vi } from "vitest";
import { createAuthContext } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { DriveNodesListService } from "./drive-nodes-list.service.js";

describe("DriveNodesListService", () => {
  it("returns paginated items with default limit meta", async () => {
    const repo = {
      findById: vi.fn().mockResolvedValue({
        id: "p1",
        createdBy: "u1",
        name: "docs",
        parentId: "root",
        linkedTaskId: null,
      }),
      listChildren: vi.fn().mockResolvedValue({
        items: [{ id: "n1", name: "a" }],
        nextCursor: "cursor",
      }),
    };
    const backfill = {
      ensureArchiveFilesForFolder: vi.fn().mockResolvedValue(undefined),
    };
    const service = new DriveNodesListService(repo as never, backfill as never);
    const actor = createAuthContext({
      userId: "u1",
      role: "lawyer",
      username: "l",
      requiresPasswordChange: false,
    });

    const result = await service.list(actor, "token", {
      parentId: "p1",
      limit: 50,
    });
    expect(result.items).toHaveLength(1);
    expect(result.meta.limit).toBe(50);
    expect(result.meta.nextCursor).toBe("cursor");
  });
});
