import { describe, expect, it, vi } from "vitest";
import { AiModelsListController } from "./ai-models-list.controller.js";
import { runWithRequestContext } from "../middleware/request-context.js";

describe("AiModelsListController", () => {
  it("returns list payload", async () => {
    const service = {
      list: vi.fn().mockResolvedValue({ items: [], meta: { limit: 50 } }),
    };
    const controller = new AiModelsListController(service as never, "x-request-id");

    const req = { url: "/api/admin/ai/models", method: "GET" } as never;
    let body = "";
    const res = {
      statusCode: 0,
      setHeader: () => undefined,
      end: (chunk: string) => {
        body = chunk;
      },
    } as never;

    await runWithRequestContext(
      { requestId: "r1", method: "GET", path: "/api/admin/ai/models" },
      () => controller.handle(req, res),
    );

    expect(JSON.parse(body).success).toBe(true);
  });
});
