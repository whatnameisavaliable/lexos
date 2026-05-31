import { describe, expect, it, vi } from "vitest";
import { createAuthContext } from "@lexos/shared";
import { SettingsGetController } from "./settings-get.controller.js";
import { runWithRequestContext } from "../middleware/request-context.js";

describe("SettingsGetController", () => {
  it("returns setting by key", async () => {
    const service = {
      get: vi.fn().mockResolvedValue({
        key: "retention.days",
        value: { days: 365 },
        updatedBy: "admin-1",
        updatedAt: "2026-05-31T00:00:00.000Z",
      }),
    };
    const controller = new SettingsGetController(
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
        path: "/api/admin/settings/retention.days",
        accessToken: "admin-token",
        auth: createAuthContext({
          userId: "admin-1",
          role: "admin",
          username: "admin",
          requiresPasswordChange: false,
        }),
      },
      () =>
        controller.handle({} as never, res, { key: "retention.days" }),
    );

    expect(JSON.parse(body).data.key).toBe("retention.days");
  });
});
