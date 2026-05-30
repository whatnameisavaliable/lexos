import { describe, expect, it, vi } from "vitest";
import { createAuthContext } from "@lexos/shared";
import { TranscriptionTaskExportDocxController } from "./transcription-task-export-docx.controller.js";
import { runWithRequestContext } from "../middleware/request-context.js";

describe("TranscriptionTaskExportDocxController", () => {
  it("returns export signed URL", async () => {
    const service = {
      exportDocx: vi.fn().mockResolvedValue({
        signedUrl: "https://signed.example/export.docx",
        bucket: "exports",
      }),
    };
    const controller = new TranscriptionTaskExportDocxController(
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
        path: "/api/transcription/tasks/t1/export/docx",
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
