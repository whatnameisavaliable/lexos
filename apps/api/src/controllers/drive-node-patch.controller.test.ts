import { describe, expect, it, vi } from "vitest";
import { createAuthContext } from "@lexos/shared";
import { DriveNodePatchController } from "./drive-node-patch.controller.js";
import { runWithRequestContext } from "../middleware/request-context.js";

describe("DriveNodePatchController", () => {
  it("updates node", async () => {
    const service = {
      update: vi.fn().mockResolvedValue({ id: "n1", name: "新名称" }),
    };
    const controller = new DriveNodePatchController(service as never, "x-request-id");
    const req = {
      url: "/api/drive/nodes/n1",
      method: "PATCH",
      async *[Symbol.asyncIterator]() {
        yield Buffer.from(JSON.stringify({ name: "新名称" }));
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
        method: "PATCH",
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

    expect(JSON.parse(body).data.name).toBe("新名称");
  });
});
