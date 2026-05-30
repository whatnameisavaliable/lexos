import { describe, expect, it, vi } from "vitest";
import { createAuthContext } from "@lexos/shared";
import { DriveRootController } from "./drive-root.controller.js";
import { runWithRequestContext } from "../middleware/request-context.js";

describe("DriveRootController", () => {
  it("returns root id", async () => {
    const service = {
      getOrCreateRoot: vi.fn().mockResolvedValue({ rootId: "root-1" }),
    };
    const controller = new DriveRootController(service as never, "x-request-id");
    const req = { url: "/api/drive/root", method: "GET" } as never;
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
        path: "/api/drive/root",
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

    expect(JSON.parse(body).data.rootId).toBe("root-1");
  });
});
