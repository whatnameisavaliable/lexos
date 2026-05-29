import { describe, expect, it, vi } from "vitest";
import { createAuthContext } from "@lexos/shared";
import { TranscriptionTasksGetController } from "./transcription-tasks-get.controller.js";
import { runWithRequestContext } from "../middleware/request-context.js";

describe("TranscriptionTasksGetController", () => {
  it("returns task payload", async () => {
    const service = {
      get: vi.fn().mockResolvedValue({
        id: "t1",
        status: "uploading",
      }),
    };
    const controller = new TranscriptionTasksGetController(
      service as never,
      "x-request-id",
    );

    const req = { method: "GET" } as never;
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
        method: "GET",
        path: "/api/transcription/tasks/t1",
        accessToken: "token",
        auth: createAuthContext({
          userId: "u1",
          role: "lawyer",
          username: "l",
          requiresPasswordChange: false,
        }),
      },
      () => controller.handle(req, res, { id: "t1" }),
    );

    expect(JSON.parse(body).data.id).toBe("t1");
  });
});
