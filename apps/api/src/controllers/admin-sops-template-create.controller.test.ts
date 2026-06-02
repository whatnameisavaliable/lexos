import { describe, expect, it, vi } from "vitest";
import { AdminSopsTemplateCreateController } from "./admin-sops-template-create.controller.js";
import { runWithRequestContext } from "../middleware/request-context.js";

describe("AdminSopsTemplateCreateController", () => {
  it("creates template", async () => {
    const service = {
      create: vi.fn().mockResolvedValue({ templateId: "t1", versionId: "v1" }),
    };
    const controller = new AdminSopsTemplateCreateController(
      service as never,
      "x-request-id",
    );

    const req = {
      method: "POST",
      async *[Symbol.asyncIterator]() {
        yield Buffer.from(
          JSON.stringify({ name: "SOP", caseType: "civil" }),
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
        path: "/api/admin/sops/templates",
        auth: {
          userId: "admin",
          role: "admin",
          username: "admin",
          requiresPasswordChange: false,
        },
      },
      () => controller.handle(req, res),
    );

    expect(JSON.parse(body).success).toBe(true);
  });
});
