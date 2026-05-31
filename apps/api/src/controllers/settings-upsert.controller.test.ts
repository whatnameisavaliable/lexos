import { describe, expect, it, vi } from "vitest";
import { createAuthContext } from "@lexos/shared";
import { SettingsUpsertController } from "./settings-upsert.controller.js";
import { runWithRequestContext } from "../middleware/request-context.js";

describe("SettingsUpsertController", () => {
  it("upserts setting", async () => {
    const service = {
      upsert: vi.fn().mockResolvedValue({
        key: "retention.days",
        value: { days: 30 },
        updatedBy: "admin-1",
        updatedAt: "2026-05-31T00:00:00.000Z",
      }),
    };
    const controller = new SettingsUpsertController(
      service as never,
      "x-request-id",
    );

    const req = {
      async *[Symbol.asyncIterator]() {
        yield Buffer.from(JSON.stringify({ value: { days: 30 } }));
      },
    } as never;

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
        method: "PUT",
        path: "/api/admin/settings/retention.days",
        accessToken: "admin-token",
        auth: createAuthContext({
          userId: "admin-1",
          role: "admin",
          username: "admin",
          requiresPasswordChange: false,
        }),
      },
      () => controller.handle(req, res, { key: "retention.days" }),
    );

    expect(JSON.parse(body).data.value).toEqual({ days: 30 });
    expect(service.upsert).toHaveBeenCalled();
  });
});
