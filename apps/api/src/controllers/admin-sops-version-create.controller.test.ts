import { describe, expect, it, vi } from "vitest";
import { AdminSopsVersionCreateController } from "./admin-sops-version-create.controller.js";
import { runWithRequestContext } from "../middleware/request-context.js";

describe("AdminSopsVersionCreateController", () => {
  it("creates draft version", async () => {
    const service = {
      create: vi.fn().mockResolvedValue({ versionId: "v2" }),
    };
    const controller = new AdminSopsVersionCreateController(
      service as never,
      "x-request-id",
    );

    const req = {
      method: "POST",
      async *[Symbol.asyncIterator]() {
        yield Buffer.from("{}");
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
        path: "/api/admin/sops/templates/t1/versions",
        auth: {
          userId: "admin",
          role: "admin",
          username: "admin",
          requiresPasswordChange: false,
        },
      },
      () => controller.handle(req, res, { template_id: "t1" }),
    );

    expect(JSON.parse(body).data.versionId).toBe("v2");
  });
});
