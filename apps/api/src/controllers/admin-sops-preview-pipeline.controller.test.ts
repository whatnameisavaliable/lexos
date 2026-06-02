import { describe, expect, it, vi } from "vitest";
import { AdminSopsPreviewPipelineController } from "./admin-sops-preview-pipeline.controller.js";
import { runWithRequestContext } from "../middleware/request-context.js";

describe("AdminSopsPreviewPipelineController", () => {
  it("returns LLM preview summary", async () => {
    const service = {
      preview: vi.fn().mockResolvedValue({
        content: "summary text",
        modelId: "m1",
        isFallback: false,
        latencyMs: 12,
      }),
    };
    const controller = new AdminSopsPreviewPipelineController(
      service as never,
      "x-request-id",
    );

    const req = {
      method: "POST",
      async *[Symbol.asyncIterator]() {
        yield Buffer.from(
          JSON.stringify({
            templateVersionId: "00000000-0000-4000-8000-000000000010",
            stepCode: "A",
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
      { requestId: "r1", method: "POST", path: "/api/admin/sops/preview-pipeline" },
      () => controller.handle(req, res),
    );

    expect(JSON.parse(body).data.content).toBe("summary text");
  });
});
