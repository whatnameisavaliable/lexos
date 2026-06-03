import { Readable } from "node:stream";
import type { IncomingMessage } from "node:http";
import { describe, expect, it, vi } from "vitest";
import { createAuthContext } from "@lexos/shared";
import { SopUploadsInitController } from "./sop-uploads-init.controller.js";
import { runWithRequestContext } from "../middleware/request-context.js";

describe("SopUploadsInitController", () => {
  it("delegates to service", async () => {
    const service = {
      init: vi.fn().mockResolvedValue({ ok: true, version: 1 }),
    };
    const controller = new SopUploadsInitController(service as never, "x-request-id");
    const req = Readable.from([
      Buffer.from(
        JSON.stringify({
          pipelineId: "00000000-0000-4000-8000-000000000010",
          fileName: "evidence.mp3",
          mimeType: "audio/mpeg",
          sizeBytes: 100,
        }),
      ),
    ]) as IncomingMessage;
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
        path: "/api/sops/uploads/init",
        accessToken: "token",
        auth: createAuthContext({ userId: "u1", role: "lawyer", username: "l", requiresPasswordChange: false }),
      },
      () => controller.handle(req, res),
    );
    expect(service.init).toHaveBeenCalled();
    expect(JSON.parse(body).success).toBe(true);
  });
});
