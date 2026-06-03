import { Readable } from "node:stream";
import type { IncomingMessage } from "node:http";
import { describe, expect, it, vi } from "vitest";
import { createAuthContext } from "@lexos/shared";
import { SopUploadsCompleteController } from "./sop-uploads-complete.controller.js";
import { runWithRequestContext } from "../middleware/request-context.js";

describe("SopUploadsCompleteController", () => {
  it("delegates to service", async () => {
    const service = {
      complete: vi.fn().mockResolvedValue({ ok: true, version: 1 }),
    };
    const controller = new SopUploadsCompleteController(service as never, "x-request-id");
    const req = Readable.from([Buffer.from(JSON.stringify({ uploadSessionId: "00000000-0000-4000-8000-000000000001" }))]) as IncomingMessage;
    req.headers = {};
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
        path: "/api/sops/uploads/complete",
        accessToken: "token",
        auth: createAuthContext({ userId: "u1", role: "lawyer", username: "l", requiresPasswordChange: false }),
      },
      () => controller.handle(req, res),
    );
    expect(service.complete).toHaveBeenCalled();
    expect(JSON.parse(body).success).toBe(true);
  });
});
