import { Readable } from "node:stream";
import type { IncomingMessage } from "node:http";
import { describe, expect, it, vi } from "vitest";
import { createAuthContext } from "@lexos/shared";
import { TranscriptionUploadsCompleteController } from "./transcription-uploads-complete.controller.js";
import { runWithRequestContext } from "../middleware/request-context.js";

describe("TranscriptionUploadsCompleteController", () => {
  it("returns complete payload", async () => {
    const service = {
      complete: vi.fn().mockResolvedValue({ taskId: "t1", status: "queued" }),
    };
    const controller = new TranscriptionUploadsCompleteController(
      service as never,
      "x-request-id",
    );

    const req = Readable.from([
      Buffer.from(
        JSON.stringify({
          uploadSessionId: "550e8400-e29b-41d4-a716-446655440000",
        }),
      ),
    ]) as IncomingMessage;

    let body = "";
    const res = {
      statusCode: 0,
      setHeader: () => undefined,
      end: (chunk: string) => {
        body = chunk;
      },
    } as never;

    await runWithRequestContext(
      {
        requestId: "r1",
        method: "POST",
        path: "/api/transcription/uploads/complete",
        accessToken: "token",
        auth: createAuthContext({
          userId: "u1",
          role: "lawyer",
          username: "l",
          requiresPasswordChange: false,
        }),
      },
      () => controller.handle(req, res),
    );

    expect(JSON.parse(body).data.status).toBe("queued");
  });
});
