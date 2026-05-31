import { describe, expect, it, vi } from "vitest";
import { createAuthContext } from "@lexos/shared";
import { AuditLogGetController } from "./audit-log-get.controller.js";
import { runWithRequestContext } from "../middleware/request-context.js";

describe("AuditLogGetController", () => {
  it("returns audit log detail", async () => {
    const service = {
      get: vi.fn().mockResolvedValue({
        id: "log-1",
        action: "auth.login_success",
        actorId: "u1",
        targetType: null,
        targetId: null,
        ipAddress: null,
        userAgent: null,
        metadata: {},
        createdAt: "2026-05-31T00:00:00.000Z",
        rowHash: "hash",
      }),
    };
    const controller = new AuditLogGetController(
      service as never,
      "x-request-id",
    );

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
        path: "/api/admin/audit/logs/log-1",
        accessToken: "admin-token",
        auth: createAuthContext({
          userId: "admin-1",
          role: "admin",
          username: "admin",
          requiresPasswordChange: false,
        }),
      },
      () =>
        controller.handle({} as never, res, { id: "log-1" }),
    );

    expect(JSON.parse(body).data.id).toBe("log-1");
  });
});
