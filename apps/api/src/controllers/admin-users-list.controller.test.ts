import { describe, expect, it, vi } from "vitest";
import { AdminUsersListController } from "./admin-users-list.controller.js";
import { runWithRequestContext } from "../middleware/request-context.js";

describe("AdminUsersListController", () => {
  it("returns list payload", async () => {
    const adminUserListService = {
      list: vi.fn().mockResolvedValue({
        items: [],
        meta: { limit: 50 },
      }),
    };
    const controller = new AdminUsersListController(
      adminUserListService as never,
      "x-request-id",
    );

    const req = { url: "/api/admin/users?limit=50", method: "GET" } as never;
    let body = "";
    const res = {
      statusCode: 0,
      setHeader: () => undefined,
      end: (chunk: string) => {
        body = chunk;
      },
    } as never;

    await runWithRequestContext(
      { requestId: "r1", method: "GET", path: "/api/admin/users" },
      () => controller.handle(req, res),
    );

    expect(JSON.parse(body).success).toBe(true);
    expect(adminUserListService.list).toHaveBeenCalled();
  });
});
