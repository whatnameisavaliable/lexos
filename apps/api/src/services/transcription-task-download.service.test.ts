import { describe, expect, it, vi } from "vitest";
import { createAuthContext } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { TranscriptionTaskDownloadService } from "./transcription-task-download.service.js";

describe("TranscriptionTaskDownloadService", () => {
  const taskRepository = { findById: vi.fn() };
  const storageAdapter = { createSignedDownloadUrl: vi.fn() };
  const auditWriterService = { write: vi.fn() };
  const service = new TranscriptionTaskDownloadService(
    taskRepository as never,
    storageAdapter as never,
    auditWriterService as never,
  );

  it("returns signed URL and writes file.download audit", async () => {
    taskRepository.findById.mockResolvedValue({
      id: "task-1",
      createdBy: "user-1",
      sourceStorageKey: "user-1/task-1/source.mp3",
      audioStorageKey: "user-1/task-1/audio.mp3",
    });
    storageAdapter.createSignedDownloadUrl.mockResolvedValue({
      signedUrl: "https://signed.example/audio.mp3",
      expiresInSec: 300,
      objectKey: "user-1/task-1/audio.mp3",
      bucket: "media",
    });

    const result = await service.download(
      createAuthContext({
        userId: "user-1",
        role: "lawyer",
        username: "l",
        requiresPasswordChange: false,
      }),
      "token",
      "task-1",
      "audio",
    );

    expect(result.signedUrl).toContain("signed.example");
    expect(auditWriterService.write).toHaveBeenCalledWith(
      expect.objectContaining({ action: "file.download", targetId: "task-1" }),
      expect.any(Object),
    );
  });

  it("throws AUTH_FORBIDDEN for cross-user download", async () => {
    taskRepository.findById.mockResolvedValue({
      id: "task-1",
      createdBy: "other-user",
      audioStorageKey: "other-user/task-1/audio.mp3",
    });

    await expect(
      service.download(
        createAuthContext({
          userId: "user-1",
          role: "lawyer",
          username: "l",
          requiresPasswordChange: false,
        }),
        "token",
        "task-1",
        "audio",
      ),
    ).rejects.toMatchObject({ code: ErrorCode.AUTH_FORBIDDEN });
  });

  it("falls back to source when audio key is missing but source exists", async () => {
    taskRepository.findById.mockResolvedValue({
      id: "task-1",
      createdBy: "user-1",
      sourceStorageKey: "user-1/task-1/source.mp3",
      audioStorageKey: null,
    });
    storageAdapter.createSignedDownloadUrl.mockResolvedValue({
      signedUrl: "https://signed.example/source.mp3",
      expiresInSec: 300,
      objectKey: "user-1/task-1/source.mp3",
      bucket: "media",
    });

    const result = await service.download(
      createAuthContext({
        userId: "user-1",
        role: "lawyer",
        username: "l",
        requiresPasswordChange: false,
      }),
      "token",
      "task-1",
      "audio",
    );

    expect(result.objectKey).toBe("user-1/task-1/source.mp3");
    expect(storageAdapter.createSignedDownloadUrl).toHaveBeenCalledWith(
      "media",
      "user-1/task-1/source.mp3",
      "user-1",
    );
    expect(auditWriterService.write).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          downloadType: "source",
          requestedType: "audio",
        }),
      }),
      expect.any(Object),
    );
  });
});
