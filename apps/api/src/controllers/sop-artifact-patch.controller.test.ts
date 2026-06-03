import { Readable } from "node:stream";
import type { IncomingMessage } from "node:http";
import { describe, expect, it, vi } from "vitest";
import { createAuthContext } from "@lexos/shared";
import { SopArtifactPatchController } from "./sop-artifact-patch.controller.js";
import { runWithRequestContext } from "../middleware/request-context.js";

describe("SopArtifactPatchController", () => {
  it("delegates to service", async () => {
    const service = {
      patch: vi.fn().mockResolvedValue({ ok: true, version: 1 }),
    };
    const controller = new SopArtifactPatchController(service as never, "x-request-id");
    const req = Readable.from([Buffer.from(JSON.stringify({ contentRaw: "x" }))]) as IncomingMessage;
    req.headers = { "if-match": "1" };
    let body = "";
    const res = {
      statusCode: 0,
      setHeader: () => undefined,
      end: (chunk: string) => { body = chunk; },
    } as never;
    await runWithRequestContext(
      {
        requestId: "r1",
        method: "PATCH",
        path: "/api/sops/artifacts/a1",
        accessToken: "token",
        auth: createAuthContext({ userId: "u1", role: "lawyer", username: "l", requiresPasswordChange: false }),
      },
      () => controller.handle(req, res, { id: "a1" }),
    );
    expect(service.patch).toHaveBeenCalled();
    expect(JSON.parse(body).success).toBe(true);
  });
});
