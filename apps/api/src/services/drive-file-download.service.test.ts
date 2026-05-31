import { describe, expect, it, vi } from "vitest";
import { createAuthContext } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import {
  DriveFileDownloadService,
  resolveDriveFileBucket,
} from "./drive-file-download.service.js";

describe("DriveFileDownloadService", () => {
  it("issues signed url and writes audit", async () => {
    const repo = {
      findById: vi.fn().mockResolvedValue({
        id: "file-1",
        createdBy: "u1",
        nodeType: "file",
        name: "report.pdf",
        storageKey: "u1/task-1/export-2024.pdf",
      }),
    };
    const storage = {
      createSignedDownloadUrl: vi.fn().mockResolvedValue({
        signedUrl: "https://signed",
        expiresInSec: 300,
        objectKey: "u1/task-1/export-2024.pdf",
        bucket: "exports",
      }),
    };
    const audit = { write: vi.fn().mockResolvedValue(undefined) };
    const service = new DriveFileDownloadService(
      repo as never,
      storage as never,
      audit as never,
    );
    const actor = createAuthContext({
      userId: "u1",
      role: "lawyer",
      username: "l",
      requiresPasswordChange: false,
    });

    const result = await service.download(actor, "token", "file-1");
    expect(result.signedUrl).toBe("https://signed");
    expect(storage.createSignedDownloadUrl).toHaveBeenCalledWith(
      "exports",
      "u1/task-1/export-2024.pdf",
      "u1",
    );
    expect(audit.write).toHaveBeenCalled();
  });

  it("resolveDriveFileBucket picks exports for export keys", () => {
    expect(resolveDriveFileBucket("u1/t1/export-1.pdf")).toBe("exports");
    expect(resolveDriveFileBucket("u1/t1/audio.mp3")).toBe("media");
  });
});
