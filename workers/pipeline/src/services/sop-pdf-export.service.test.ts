import { describe, expect, it, vi } from "vitest";
import type { SopOutboxPayload } from "@lexos/shared";
import { createMockPool } from "../test/pg-test-helpers.js";
import { SopPdfExportService } from "./sop-pdf-export.service.js";

describe("SopPdfExportService", () => {
  const payload: SopOutboxPayload = {
    stage: "sop.pdf_export",
    pipeline_id: "pipe-1",
    step_code: "03-A",
    artifact_id: "art-1",
  };

  it("uploads pdf and links drive node", async () => {
    const pipelineRepository = {
      assertLawyerPipelineWritable: vi.fn(),
      findPipelineWithLawyer: vi.fn().mockResolvedValue({
        lawyerId: "lawyer-1",
      }),
    };
    const artifactRepository = {
      loadFinalizedSnapshotHtml: vi.fn().mockResolvedValue("<html>ok</html>"),
      setLinkedDriveNodeId: vi.fn(),
    };
    const exportsStorage = {
      uploadPdfBuffer: vi.fn().mockResolvedValue(undefined),
    };
    const sopDriveRepository = {
      linkPdfToDriveNode: vi.fn().mockResolvedValue("drive-1"),
    };
    const pdfRenderer = {
      renderHtmlToPdfBuffer: vi.fn().mockResolvedValue(Buffer.from("pdf")),
    };

    const service = new SopPdfExportService(
      pipelineRepository as never,
      artifactRepository as never,
      exportsStorage as never,
      sopDriveRepository as never,
      pdfRenderer,
    );

    await service.run(createMockPool(), payload);

    expect(exportsStorage.uploadPdfBuffer).toHaveBeenCalledWith(
      "lawyer-1/sops/pipe-1/art-1.pdf",
      expect.any(Buffer),
    );
    expect(artifactRepository.setLinkedDriveNodeId).toHaveBeenCalledWith(
      expect.anything(),
      "art-1",
      "drive-1",
    );
  });

  it("does not mutate artifact status when render fails", async () => {
    const artifactRepository = {
      loadFinalizedSnapshotHtml: vi.fn().mockResolvedValue("<html>x</html>"),
      setArtifactStatus: vi.fn(),
      setLinkedDriveNodeId: vi.fn(),
    };
    const service = new SopPdfExportService(
      {
        assertLawyerPipelineWritable: vi.fn(),
        findPipelineWithLawyer: vi.fn().mockResolvedValue({ lawyerId: "u1" }),
      } as never,
      artifactRepository as never,
      { uploadPdfBuffer: vi.fn() } as never,
      {} as never,
      {
        renderHtmlToPdfBuffer: vi.fn().mockRejectedValue(new Error("render fail")),
      },
    );

    await expect(service.run(createMockPool(), payload)).rejects.toThrow(/render fail/);
    expect(artifactRepository.setArtifactStatus).not.toHaveBeenCalled();
  });
});
