import { describe, expect, it, vi } from "vitest";
import { createAuthContext } from "@lexos/shared";
import { DriveSearchController } from "./drive-search.controller.js";
import { runWithRequestContext } from "../middleware/request-context.js";

describe("DriveSearchController", () => {
  it("returns search results", async () => {
    const service = {
      search: vi.fn().mockResolvedValue({ items: [], meta: { limit: 50 } }),
    };
    const controller = new DriveSearchController(service as never, "x-request-id");
    const req = { url: "/api/drive/search?q=合同", method: "GET" } as never;
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
        path: "/api/drive/search",
        accessToken: "token",
        auth: createAuthContext({
          userId: "u1",
          role: "lawyer",
          username: "l",
          requiresPasswordChange: false,
        }),
      },
      () => controller.handle(req, res),
    );

    expect(JSON.parse(body).success).toBe(true);
  });
});
