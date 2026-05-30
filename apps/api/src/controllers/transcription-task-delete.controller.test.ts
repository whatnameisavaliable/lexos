import { describe, expect, it, vi } from "vitest";
import { createAuthContext } from "@lexos/shared";
import { TranscriptionTaskDeleteController } from "./transcription-task-delete.controller.js";
import { runWithRequestContext } from "../middleware/request-context.js";

describe("TranscriptionTaskDeleteController", () => {
  it("returns deleted task payload", async () => {
    const service = {
      delete: vi.fn().mockResolvedValue({
        id: "t1",
        status: "completed",
        deletedAt: "2026-01-01T00:00:00.000Z",
      }),
    };
    const controller = new TranscriptionTaskDeleteController(
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
        method: "DELETE",
        path: "/api/transcription/tasks/t1",
        accessToken: "token",
        auth: createAuthContext({
          userId: "u1",
          role: "lawyer",
          username: "l",
          requiresPasswordChange: false,
        }),
      },
      () => controller.handle({ headers: {} } as never, res, { id: "t1" }),
    );

    expect(JSON.parse(body).data.id).toBe("t1");
  });
});
