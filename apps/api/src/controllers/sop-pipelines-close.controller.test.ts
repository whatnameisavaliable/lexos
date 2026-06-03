import { Readable } from "node:stream";
import type { IncomingMessage } from "node:http";
import { describe, expect, it, vi } from "vitest";
import { createAuthContext } from "@lexos/shared";
import { SopPipelinesCloseController } from "./sop-pipelines-close.controller.js";
import { runWithRequestContext } from "../middleware/request-context.js";

describe("SopPipelinesCloseController", () => {
  it("delegates to service", async () => {
    const service = {
      close: vi.fn().mockResolvedValue({ ok: true, version: 1 }),
    };
    const controller = new SopPipelinesCloseController(service as never, "x-request-id");
    const req = { headers: {} } as IncomingMessage;
    let body = "";
    const res = {
      statusCode: 0,
      setHeader: () => undefined,
      end: (chunk: string) => { body = chunk; },
    } as never;
    await runWithRequestContext(
      {
        requestId: "r1",
        method: "POST",
        path: "/api/sops/pipelines/p1/close",
        accessToken: "token",
        auth: createAuthContext({ userId: "u1", role: "lawyer", username: "l", requiresPasswordChange: false }),
      },
      () => controller.handle(req, res, { id: "p1" }),
    );
    expect(service.close).toHaveBeenCalled();
    expect(JSON.parse(body).success).toBe(true);
  });
});
