import { describe, expect, it, vi } from "vitest";
import { createAuthContext } from "@lexos/shared";
import { TranscriptionTaskExportTxtController } from "./transcription-task-export-txt.controller.js";
import { runWithRequestContext } from "../middleware/request-context.js";

describe("TranscriptionTaskExportTxtController", () => {
  it("returns export signed URL", async () => {
    const service = {
      exportTxt: vi.fn().mockResolvedValue({
        signedUrl: "https://signed.example/export.txt",
        bucket: "exports",
      }),
    };
    const controller = new TranscriptionTaskExportTxtController(
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
        method: "POST",
        path: "/api/transcription/tasks/t1/export/txt",
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

    expect(JSON.parse(body).data.bucket).toBe("exports");
  });
});
