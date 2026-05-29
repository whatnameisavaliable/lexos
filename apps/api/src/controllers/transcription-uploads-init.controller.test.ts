import { Readable } from "node:stream";
import type { IncomingMessage } from "node:http";
import { describe, expect, it, vi } from "vitest";
import { createAuthContext } from "@lexos/shared";
import { TranscriptionUploadsInitController } from "./transcription-uploads-init.controller.js";
import { runWithRequestContext } from "../middleware/request-context.js";

describe("TranscriptionUploadsInitController", () => {
  it("returns init payload", async () => {
    const service = {
      init: vi.fn().mockResolvedValue({
        uploadSessionId: "s1",
        taskId: "t1",
        storageKeyPrefix: "u/t/",
        tusEndpoint: "https://example.supabase.co/storage/v1/upload/resumable/sign",
      }),
    };
    const controller = new TranscriptionUploadsInitController(
      service as never,
      "x-request-id",
    );

    const req = Readable.from([
      Buffer.from(
        JSON.stringify({
          title: "t",
          fileName: "a.mp3",
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
      end: (chunk: string) => {
        body = chunk;
      },
    } as never;

    await runWithRequestContext(
      {
        requestId: "r1",
        method: "POST",
        path: "/api/transcription/uploads/init",
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

    expect(JSON.parse(body).success).toBe(true);
    expect(JSON.parse(body).data.taskId).toBe("t1");
  });
});
