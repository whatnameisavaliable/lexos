import { describe, expect, it, vi } from "vitest";
import { AdminSopsVersionGetController } from "./admin-sops-version-get.controller.js";
import { runWithRequestContext } from "../middleware/request-context.js";

describe("AdminSopsVersionGetController", () => {
  it("returns version detail", async () => {
    const service = {
      getVersion: vi.fn().mockResolvedValue({ versionId: "v1" }),
    };
    const controller = new AdminSopsVersionGetController(
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
        path: "/api/admin/sops/template-versions/v1",
      },
      () => controller.handle({} as never, res, { version_id: "v1" }),
    );

    expect(JSON.parse(body).data.versionId).toBe("v1");
  });
});
