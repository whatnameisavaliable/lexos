import { describe, expect, it, vi } from "vitest";
import { SopPdfExportService } from "./sop-pdf-export.service.js";

describe("SopPdfExportService.linkPdfToDriveNode", () => {
  it("creates drive node via sop drive repository", async () => {
    const sopDriveRepository = {
      linkPdfToDriveNode: vi.fn().mockResolvedValue("node-1"),
    };
    const service = new SopPdfExportService(
      {} as never,
      {} as never,
      {} as never,
      sopDriveRepository as never,
      { renderHtmlToPdfBuffer: vi.fn() } as never,
    );

    const id = await service.linkPdfToDriveNode({} as never, {
      ownerId: "u1",
      pipelineId: "p1",
      artifactId: "a1",
      storageKey: "u1/sops/p1/a1.pdf",
      pdfFileName: "a1.pdf",
    });

    expect(id).toBe("node-1");
  });
});
