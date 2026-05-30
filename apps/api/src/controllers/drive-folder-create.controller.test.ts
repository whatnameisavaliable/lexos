import { describe, expect, it, vi } from "vitest";
import { createAuthContext } from "@lexos/shared";
import { DriveFolderCreateController } from "./drive-folder-create.controller.js";
import { runWithRequestContext } from "../middleware/request-context.js";

describe("DriveFolderCreateController", () => {
  it("creates folder", async () => {
    const service = {
      create: vi.fn().mockResolvedValue({ id: "f1", name: "资料" }),
    };
    const controller = new DriveFolderCreateController(
      service as never,
      "x-request-id",
    );
    const req = {
      url: "/api/drive/folders",
      method: "POST",
      async *[Symbol.asyncIterator]() {
        yield Buffer.from(
          JSON.stringify({
            parentId: "00000000-0000-4000-8000-000000000001",
            name: "资料",
          }),
        );
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
        method: "POST",
        path: "/api/drive/folders",
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

    expect(JSON.parse(body).data.name).toBe("资料");
  });
});
