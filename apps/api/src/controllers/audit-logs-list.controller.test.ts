import { describe, expect, it, vi } from "vitest";
import { createAuthContext } from "@lexos/shared";
import { AuditLogsListController } from "./audit-logs-list.controller.js";
import { runWithRequestContext } from "../middleware/request-context.js";

describe("AuditLogsListController", () => {
  it("returns audit log list", async () => {
    const service = {
      list: vi.fn().mockResolvedValue({ items: [], meta: { limit: 50 } }),
    };
    const controller = new AuditLogsListController(
      service as never,
      "x-request-id",
    );

    const req = { url: "/api/admin/audit/logs", method: "GET" } as never;
    let body = "";
    const res = {
      statusCode: 0,
      setHeader: () => undefined,
      end: (chunk: string) => {
        body = chunk;
      },
    } as never;

    await runWithRequestContext(
      {
        requestId: "r1",
        method: "GET",
        path: "/api/admin/audit/logs",
        accessToken: "admin-token",
        auth: createAuthContext({
          userId: "admin-1",
          role: "admin",
          username: "admin",
          requiresPasswordChange: false,
        }),
      },
      () => controller.handle(req, res),
    );

    expect(JSON.parse(body).success).toBe(true);
    expect(service.list).toHaveBeenCalledWith("admin-token", { limit: 50 });
  });
});
