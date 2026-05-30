import { describe, expect, it, vi } from "vitest";
import { createAuthContext } from "@lexos/shared";
import { DriveNodesListController } from "./drive-nodes-list.controller.js";
import { runWithRequestContext } from "../middleware/request-context.js";

describe("DriveNodesListController", () => {
  it("returns list payload", async () => {
    const service = {
      list: vi.fn().mockResolvedValue({ items: [], meta: { limit: 50 } }),
    };
    const controller = new DriveNodesListController(service as never, "x-request-id");
    const req = {
      url: "/api/drive/nodes?parentId=00000000-0000-4000-8000-000000000001",
      method: "GET",
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
        method: "GET",
        path: "/api/drive/nodes",
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
