import { describe, expect, it, vi } from "vitest";
import { createAuthContext } from "@lexos/shared";
import { TranscriptionTaskDownloadController } from "./transcription-task-download.controller.js";
import { runWithRequestContext } from "../middleware/request-context.js";

describe("TranscriptionTaskDownloadController", () => {
  it("returns signed download URL", async () => {
    const service = {
      download: vi.fn().mockResolvedValue({
        signedUrl: "https://signed.example/audio.mp3",
        expiresInSec: 300,
      }),
    };
    const controller = new TranscriptionTaskDownloadController(
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
        path: "/api/transcription/tasks/t1/download",
        accessToken: "token",
        auth: createAuthContext({
          userId: "u1",
          role: "lawyer",
          username: "l",
          requiresPasswordChange: false,
        }),
      },
      () =>
        controller.handle(
          {
            url: "/api/transcription/tasks/t1/download?type=audio",
            headers: {},
          } as never,
          res,
          { id: "t1" },
        ),
    );

    expect(JSON.parse(body).data.signedUrl).toContain("signed.example");
    expect(service.download).toHaveBeenCalledWith(
      expect.anything(),
      "token",
      "t1",
      "audio",
      expect.any(Object),
    );
  });
});
