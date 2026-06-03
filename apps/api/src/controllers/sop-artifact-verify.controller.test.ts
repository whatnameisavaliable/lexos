import { Readable } from "node:stream";
import type { IncomingMessage } from "node:http";
import { describe, expect, it, vi } from "vitest";
import { createAuthContext } from "@lexos/shared";
import { SopArtifactVerifyController } from "./sop-artifact-verify.controller.js";
import { runWithRequestContext } from "../middleware/request-context.js";

describe("SopArtifactVerifyController", () => {
  it("delegates to service", async () => {
    const service = {
      verify: vi.fn().mockResolvedValue({ ok: true, version: 1 }),
    };
    const controller = new SopArtifactVerifyController(service as never, "x-request-id");
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
        path: "/api/sops/artifacts/a1/verify",
        accessToken: "token",
        auth: createAuthContext({ userId: "u1", role: "lawyer", username: "l", requiresPasswordChange: false }),
      },
      () => controller.handle(req, res, { id: "a1" }),
    );
    expect(service.verify).toHaveBeenCalled();
    expect(JSON.parse(body).success).toBe(true);
  });
});
