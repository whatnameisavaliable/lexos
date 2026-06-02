import { describe, expect, it, vi } from "vitest";
import { AdminSopsVersionPublishController } from "./admin-sops-version-publish.controller.js";
import { runWithRequestContext } from "../middleware/request-context.js";

describe("AdminSopsVersionPublishController", () => {
  it("publishes version", async () => {
    const service = {
      publish: vi.fn().mockResolvedValue({ versionId: "v1", versionNumber: 1 }),
    };
    const controller = new AdminSopsVersionPublishController(
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
        method: "POST",
        path: "/api/admin/sops/template-versions/v1/publish",
        auth: {
          userId: "admin",
          role: "admin",
          username: "admin",
          requiresPasswordChange: false,
        },
      },
      () =>
        controller.handle(
          { headers: {} } as never,
          res,
          { version_id: "v1" },
        ),
    );

    expect(JSON.parse(body).data.versionNumber).toBe(1);
  });
});
