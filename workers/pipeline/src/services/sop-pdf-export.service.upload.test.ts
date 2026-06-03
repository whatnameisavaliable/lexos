import { describe, expect, it, vi } from "vitest";
import { SopPdfExportService } from "./sop-pdf-export.service.js";

describe("SopPdfExportService.uploadPdfToExports", () => {
  it("uploads buffer via exports storage adapter", async () => {
    const exportsStorage = {
      uploadPdfBuffer: vi.fn().mockResolvedValue(undefined),
    };
    const service = new SopPdfExportService(
      {} as never,
      {} as never,
      exportsStorage as never,
      {} as never,
      { renderHtmlToPdfBuffer: vi.fn() } as never,
    );

    await service.uploadPdfToExports(Buffer.from("x"), "u1/sops/p1/a.pdf");
    expect(exportsStorage.uploadPdfBuffer).toHaveBeenCalledWith(
      "u1/sops/p1/a.pdf",
      expect.any(Buffer),
    );
  });
});
