import { describe, expect, it, vi } from "vitest";
import { createAuthContext } from "@lexos/shared";
import { SettingsListController } from "./settings-list.controller.js";
import { runWithRequestContext } from "../middleware/request-context.js";

describe("SettingsListController", () => {
  it("returns settings list", async () => {
    const service = {
      list: vi.fn().mockResolvedValue({ items: [] }),
    };
    const controller = new SettingsListController(
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
        path: "/api/admin/settings",
        accessToken: "admin-token",
        auth: createAuthContext({
          userId: "admin-1",
          role: "admin",
          username: "admin",
          requiresPasswordChange: false,
        }),
      },
      () => controller.handle({} as never, res),
    );

    expect(JSON.parse(body).success).toBe(true);
  });
});
