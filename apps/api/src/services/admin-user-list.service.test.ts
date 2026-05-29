import { describe, expect, it, vi } from "vitest";
import { AdminUserListService } from "./admin-user-list.service.js";

describe("AdminUserListService", () => {
  it("returns items and pagination meta", async () => {
    const adminUserRepository = {
      listUsers: vi.fn().mockResolvedValue({
        items: [{ id: "u1", username: "a" }],
        nextCursor: "c1",
      }),
    };
    const service = new AdminUserListService(adminUserRepository as never);

    const result = await service.list({ limit: 50 });

    expect(result.items).toHaveLength(1);
    expect(result.meta.limit).toBe(50);
    expect(result.meta.nextCursor).toBe("c1");
  });
});
