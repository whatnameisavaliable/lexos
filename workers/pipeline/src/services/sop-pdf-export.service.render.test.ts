import { describe, expect, it, vi } from "vitest";
import { SopPdfExportService } from "./sop-pdf-export.service.js";

describe("SopPdfExportService.renderHtmlToPdfBuffer", () => {
  it("delegates to injected renderer", async () => {
    const renderer = {
      renderHtmlToPdfBuffer: vi.fn().mockResolvedValue(Buffer.from("pdf")),
    };
    const service = new SopPdfExportService(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      renderer,
    );

    const buf = await service.renderHtmlToPdfBuffer("<html></html>");
    expect(buf.toString()).toBe("pdf");
  });
});
