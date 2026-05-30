import { describe, expect, it, vi } from "vitest";
import { createAuthContext } from "@lexos/shared";
import { TranscriptionExportPdfService } from "./transcription-export-pdf.service.js";

describe("TranscriptionExportPdfService", () => {
  const taskRepository = { findById: vi.fn() };
  const transcriptRepository = { findByTaskId: vi.fn() };
  const exportAdapter = { generate: vi.fn() };
  const storageAdapter = {
    uploadObject: vi.fn(),
    createSignedDownloadUrl: vi.fn(),
  };
  const auditLogRepository = { append: vi.fn() };
  const service = new TranscriptionExportPdfService(
    taskRepository as never,
    transcriptRepository as never,
    exportAdapter as never,
    storageAdapter as never,
    auditLogRepository as never,
  );

  it("uploads pdf export to exports bucket", async () => {
    taskRepository.findById.mockResolvedValue({
      id: "task-1",
      createdBy: "user-1",
      title: "访谈",
    });
    transcriptRepository.findByTaskId.mockResolvedValue({
      polishedText: "正文",
      summaryText: null,
    });
    exportAdapter.generate.mockResolvedValue(Buffer.from("pdf"));
    storageAdapter.createSignedDownloadUrl.mockResolvedValue({
      signedUrl: "https://signed.example/export.pdf",
      expiresInSec: 300,
      objectKey: "user-1/task-1/export.pdf",
      bucket: "exports",
    });

    const result = await service.exportPdf(
      createAuthContext({
        userId: "user-1",
        role: "lawyer",
        username: "l",
        requiresPasswordChange: false,
      }),
      "token",
      "task-1",
    );

    expect(result.bucket).toBe("exports");
    expect(auditLogRepository.append).toHaveBeenCalledWith(
      expect.objectContaining({ action: "file.export" }),
    );
  });
});
