import { Readable } from "node:stream";
import type { IncomingMessage } from "node:http";
import { describe, expect, it, vi } from "vitest";
import { createAuthContext } from "@lexos/shared";
import { SopPipelinesStatusController } from "./sop-pipelines-status.controller.js";
import { runWithRequestContext } from "../middleware/request-context.js";

describe("SopPipelinesStatusController", () => {
  it("delegates to service", async () => {
    const service = {
      getStatus: vi.fn().mockResolvedValue({ ok: true, version: 1 }),
    };
    const controller = new SopPipelinesStatusController(service as never, "x-request-id");
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
        method: "GET",
        path: "/api/sops/pipelines/p1/status",
        accessToken: "token",
        auth: createAuthContext({ userId: "u1", role: "lawyer", username: "l", requiresPasswordChange: false }),
      },
      () => controller.handle(req, res, { id: "p1" }),
    );
    expect(service.getStatus).toHaveBeenCalled();
    expect(JSON.parse(body).success).toBe(true);
  });
});
