import { describe, expect, it, vi } from "vitest";
import { createAuthContext } from "@lexos/shared";
import { TranscriptionTranscriptGetController } from "./transcription-transcript-get.controller.js";
import { runWithRequestContext } from "../middleware/request-context.js";

describe("TranscriptionTranscriptGetController", () => {
  it("returns transcript payload", async () => {
    const service = {
      get: vi.fn().mockResolvedValue({
        taskId: "t1",
        version: 1,
        polishedText: "hello",
      }),
    };
    const controller = new TranscriptionTranscriptGetController(
      service as never,
      "x-request-id",
    );

    let body = "";
    const res = {
      setHeader: () => undefined,
      end: (chunk: string) => {
        body = chunk;
      },
    } as never;

    await runWithRequestContext(
      {
        requestId: "r1",
        method: "GET",
        path: "/api/transcription/tasks/t1/transcript",
        accessToken: "token",
        auth: createAuthContext({
          userId: "u1",
          role: "lawyer",
          username: "l",
          requiresPasswordChange: false,
        }),
      },
      () => controller.handle({} as never, res, { id: "t1" }),
    );

    expect(JSON.parse(body).data.taskId).toBe("t1");
  });
});
