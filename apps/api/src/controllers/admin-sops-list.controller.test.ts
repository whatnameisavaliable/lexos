import { describe, expect, it, vi } from "vitest";
import { AdminSopsListController } from "./admin-sops-list.controller.js";
import { runWithRequestContext } from "../middleware/request-context.js";

describe("AdminSopsListController", () => {
  it("returns list payload", async () => {
    const service = {
      list: vi.fn().mockResolvedValue({ items: [], meta: { limit: 50 } }),
    };
    const controller = new AdminSopsListController(service as never, "x-request-id");

    const req = { url: "/api/admin/sops", method: "GET" } as never;
    let body = "";
    const res = {
      statusCode: 0,
      setHeader: () => undefined,
      end: (chunk: string) => {
        body = chunk;
      },
    } as never;

    await runWithRequestContext(
      { requestId: "r1", method: "GET", path: "/api/admin/sops" },
      () => controller.handle(req, res),
    );

    expect(JSON.parse(body).success).toBe(true);
  });
});
