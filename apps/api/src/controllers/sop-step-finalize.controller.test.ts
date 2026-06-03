import { Readable } from "node:stream";
import type { IncomingMessage } from "node:http";
import { describe, expect, it, vi } from "vitest";
import { createAuthContext } from "@lexos/shared";
import { SopStepFinalizeController } from "./sop-step-finalize.controller.js";
import { runWithRequestContext } from "../middleware/request-context.js";

describe("SopStepFinalizeController", () => {
  it("delegates to service", async () => {
    const service = {
      finalize: vi.fn().mockResolvedValue({ ok: true, version: 1 }),
    };
    const controller = new SopStepFinalizeController(service as never, "x-request-id");
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
        path: "/api/sops/pipelines/p1/steps/s1/finalize",
        accessToken: "token",
        auth: createAuthContext({ userId: "u1", role: "lawyer", username: "l", requiresPasswordChange: false }),
      },
      () => controller.handle(req, res, { id: "p1", code: "s1" }),
    );
    expect(service.finalize).toHaveBeenCalled();
    expect(JSON.parse(body).success).toBe(true);
  });
});
