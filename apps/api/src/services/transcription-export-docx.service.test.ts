import { describe, expect, it, vi } from "vitest";
import { createAuthContext } from "@lexos/shared";
import { TranscriptionExportDocxService } from "./transcription-export-docx.service.js";

describe("TranscriptionExportDocxService", () => {
  const taskRepository = { findById: vi.fn() };
  const transcriptRepository = { findByTaskId: vi.fn() };
  const exportAdapter = { generate: vi.fn() };
  const storageAdapter = {
    uploadObject: vi.fn(),
    createSignedDownloadUrl: vi.fn(),
  };
  const auditLogRepository = { append: vi.fn() };
  const service = new TranscriptionExportDocxService(
    taskRepository as never,
    transcriptRepository as never,
    exportAdapter as never,
    storageAdapter as never,
    auditLogRepository as never,
  );

  it("uploads export and writes file.export audit", async () => {
    taskRepository.findById.mockResolvedValue({
      id: "task-1",
      createdBy: "user-1",
      title: "访谈",
    });
    transcriptRepository.findByTaskId.mockResolvedValue({
      polishedText: "正文",
      summaryText: "摘要",
    });
    exportAdapter.generate.mockResolvedValue(Buffer.from("docx"));
    storageAdapter.createSignedDownloadUrl.mockResolvedValue({
      signedUrl: "https://signed.example/export.docx",
      expiresInSec: 300,
      objectKey: "user-1/task-1/export.docx",
      bucket: "exports",
    });

    const result = await service.exportDocx(
      createAuthContext({
        userId: "user-1",
        role: "lawyer",
        username: "l",
        requiresPasswordChange: false,
      }),
      "token",
      "task-1",
    );

    expect(storageAdapter.uploadObject).toHaveBeenCalled();
    expect(result.bucket).toBe("exports");
    expect(auditLogRepository.append).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "file.export",
        metadata: expect.objectContaining({ format: "docx" }),
      }),
    );
  });
});
