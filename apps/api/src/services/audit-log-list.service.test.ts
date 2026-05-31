import { describe, expect, it, vi } from "vitest";
import { AuditLogListService } from "./audit-log-list.service.js";

describe("AuditLogListService", () => {
  it("returns paginated audit logs", async () => {
    const repo = {
      list: vi.fn(async () => ({
        items: [
          {
            id: "log-1",
            action: "auth.login_success",
            actorId: "u1",
            targetType: "profile",
            targetId: "u1",
            ipAddress: null,
            userAgent: null,
            metadata: {},
            createdAt: "2026-05-31T00:00:00.000Z",
            rowHash: "hash",
          },
        ],
        nextCursor: "cursor-1",
      })),
    };
    const service = new AuditLogListService(repo as never);
    const result = await service.list("admin-token", { limit: 50 });
    expect(result.items).toHaveLength(1);
    expect(result.meta.limit).toBe(50);
    expect(result.meta.nextCursor).toBe("cursor-1");
    expect(repo.list).toHaveBeenCalledWith("admin-token", { limit: 50 });
  });
});
