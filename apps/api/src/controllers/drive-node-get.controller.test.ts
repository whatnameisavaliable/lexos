import { describe, expect, it, vi } from "vitest";
import { createAuthContext } from "@lexos/shared";
import { DriveNodeGetController } from "./drive-node-get.controller.js";
import { runWithRequestContext } from "../middleware/request-context.js";

describe("DriveNodeGetController", () => {
  it("returns node payload", async () => {
    const service = {
      get: vi.fn().mockResolvedValue({ id: "n1", name: "docs" }),
    };
    const controller = new DriveNodeGetController(service as never, "x-request-id");
    const req = { url: "/api/drive/nodes/n1", method: "GET" } as never;
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
        path: "/api/drive/nodes/n1",
        accessToken: "token",
        auth: createAuthContext({
          userId: "u1",
          role: "lawyer",
          username: "l",
          requiresPasswordChange: false,
        }),
      },
      () => controller.handle(req, res, { id: "n1" }),
    );

    expect(JSON.parse(body).data.id).toBe("n1");
  });
});
