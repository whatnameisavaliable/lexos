import { describe, expect, it, vi } from "vitest";
import { createAuthContext } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { MAX_SIZE_BYTES } from "@lexos/shared";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import { TranscriptionUploadInitService } from "./transcription-upload-init.service.js";

describe("TranscriptionUploadInitService", () => {
  const actor = createAuthContext({
    userId: "user-1",
    role: "lawyer",
    username: "lawyer1",
    requiresPasswordChange: false,
  });

  const taskRepository = {
    findByIdempotencyKey: vi.fn(),
    createUploading: vi.fn(),
    updateSourceStorageKey: vi.fn(),
  };
  const uploadSessionRepository = {
    create: vi.fn(),
    findOpenByTaskId: vi.fn(),
  };
  const storageAdapter = {
    createResumableUploadUrl: vi.fn(),
  };
  const auditWriterService = {
    write: vi.fn(),
  };

  const service = new TranscriptionUploadInitService(
    taskRepository as never,
    uploadSessionRepository as never,
    storageAdapter as never,
    auditWriterService as never,
    "media",
  );

  it("throws RESOURCE_LIMIT_EXCEEDED when size over 1GB", async () => {
    await expect(
      service.init(
        actor,
        "token",
        {
          title: "大文件",
          fileName: "big.mp3",
          mimeType: "audio/mpeg",
          sizeBytes: BigInt(MAX_SIZE_BYTES) + 1n,
        },
      ),
    ).rejects.toMatchObject({
      code: ErrorCode.RESOURCE_LIMIT_EXCEEDED,
    });
  });

  it("returns idempotent session when idempotencyKey matches", async () => {
    taskRepository.findByIdempotencyKey.mockResolvedValue({
      id: "task-1",
      createdBy: "user-1",
      status: "uploading",
      sourceStorageKey: "user-1/task-1/a.mp3",
      isMp4: false,
    });
    uploadSessionRepository.findOpenByTaskId.mockResolvedValue({
      id: "session-1",
      taskId: "task-1",
      storageKeyPrefix: "user-1/task-1/",
    });
    storageAdapter.createResumableUploadUrl.mockResolvedValue({
      tusEndpoint: "https://example.supabase.co/storage/v1/upload/resumable/sign",
      tusHeaders: { "x-signature": "token" },
      objectKey: "user-1/task-1/a.mp3",
    });

    const result = await service.init(actor, "token", {
      title: "访谈",
      fileName: "a.mp3",
      mimeType: "audio/mpeg",
      sizeBytes: 1000n,
      idempotencyKey: "idem-1",
    });

    expect(result.uploadSessionId).toBe("session-1");
    expect(taskRepository.createUploading).not.toHaveBeenCalled();
  });

  it("creates task and session on first init", async () => {
    taskRepository.findByIdempotencyKey.mockResolvedValue(null);
    taskRepository.createUploading.mockResolvedValue({
      id: "task-new",
      createdBy: "user-1",
      isMp4: false,
    });
    taskRepository.updateSourceStorageKey.mockResolvedValue({});
    uploadSessionRepository.create.mockResolvedValue({
      id: "session-new",
      storageKeyPrefix: "user-1/task-new/",
    });
    storageAdapter.createResumableUploadUrl.mockResolvedValue({
      tusEndpoint: "https://example.supabase.co/storage/v1/upload/resumable/sign",
      tusHeaders: { "x-signature": "sig" },
      objectKey: "user-1/task-new/a.mp3",
    });
    auditWriterService.write.mockResolvedValue("audit-1");

    const result = await service.init(actor, "token", {
      title: "访谈",
      fileName: "a.mp3",
      mimeType: "audio/mpeg",
      sizeBytes: 1000n,
    });

    expect(result.taskId).toBe("task-new");
    expect(auditWriterService.write).toHaveBeenCalledWith(
      expect.objectContaining({ action: "task.create" }),
      expect.any(Object),
    );
  });
});
