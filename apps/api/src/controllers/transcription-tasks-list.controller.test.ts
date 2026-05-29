import { describe, expect, it, vi } from "vitest";
import { createAuthContext } from "@lexos/shared";
import { TranscriptionTasksListController } from "./transcription-tasks-list.controller.js";
import { runWithRequestContext } from "../middleware/request-context.js";

describe("TranscriptionTasksListController", () => {
  it("returns list payload", async () => {
    const service = {
      list: vi.fn().mockResolvedValue({ items: [], meta: { limit: 50 } }),
    };
    const controller = new TranscriptionTasksListController(
      service as never,
      "x-request-id",
    );

    const req = { url: "/api/transcription/tasks", method: "GET" } as never;
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
        path: "/api/transcription/tasks",
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
  });
});
