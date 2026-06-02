import { describe, expect, it, vi } from "vitest";
import { AdminSopsTemplateGetController } from "./admin-sops-template-get.controller.js";
import { runWithRequestContext } from "../middleware/request-context.js";

describe("AdminSopsTemplateGetController", () => {
  it("returns template detail", async () => {
    const service = {
      getTemplate: vi.fn().mockResolvedValue({ templateId: "t1" }),
    };
    const controller = new AdminSopsTemplateGetController(
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
      { requestId: "r1", method: "GET", path: "/api/admin/sops/templates/t1" },
      () => controller.handle({} as never, res, { template_id: "t1" }),
    );

    expect(JSON.parse(body).data.templateId).toBe("t1");
  });
});
