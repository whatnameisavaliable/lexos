import { describe, expect, it, vi } from "vitest";
import { createAuthContext } from "@lexos/shared";
import { DriveFileDownloadController } from "./drive-file-download.controller.js";
import { runWithRequestContext } from "../middleware/request-context.js";

describe("DriveFileDownloadController", () => {
  it("returns signed download url", async () => {
    const service = {
      download: vi.fn().mockResolvedValue({
        signedUrl: "https://signed",
        expiresInSec: 300,
        objectKey: "k",
        bucket: "exports",
      }),
    };
    const controller = new DriveFileDownloadController(
      service as never,
      "x-request-id",
    );
    const req = {
      url: "/api/drive/files/f1/download",
      method: "GET",
      headers: {},
    } as never;
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
        path: "/api/drive/files/f1/download",
        accessToken: "token",
        auth: createAuthContext({
          userId: "u1",
          role: "lawyer",
          username: "l",
          requiresPasswordChange: false,
        }),
      },
      () => controller.handle(req, res, { id: "f1" }),
    );

    expect(JSON.parse(body).data.signedUrl).toBe("https://signed");
  });
});
