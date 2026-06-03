import { describe, expect, it, vi } from "vitest";
import { buildExportsPdfStorageKey } from "../domain/sop/build-exports-pdf-storage-key.js";
import { createMockPool } from "../test/pg-test-helpers.js";
import { SopPdfExportService } from "../services/sop-pdf-export.service.js";

describe("SOP pdf export storage path integration", () => {
  it("uploads to {ownerId}/sops/{pipelineId}/{artifactId}.pdf", async () => {
    const ownerId = "00000000-0000-4000-8000-000000000001";
    const pipelineId = "00000000-0000-4000-8000-000000000002";
    const artifactId = "00000000-0000-4000-8000-000000000003";
    const expectedKey = buildExportsPdfStorageKey(
      ownerId,
      pipelineId,
      artifactId,
    );

    const uploadPdfBuffer = vi.fn().mockResolvedValue(undefined);
    const service = new SopPdfExportService(
      {
        assertLawyerPipelineWritable: vi.fn(),
        findPipelineWithLawyer: vi.fn().mockResolvedValue({ lawyerId: ownerId }),
      } as never,
      {
        loadFinalizedSnapshotHtml: vi.fn().mockResolvedValue("<html></html>"),
        setLinkedDriveNodeId: vi.fn(),
      } as never,
      { uploadPdfBuffer } as never,
      {
        linkPdfToDriveNode: vi.fn().mockResolvedValue("drive-1"),
      } as never,
      {
        renderHtmlToPdfBuffer: vi.fn().mockResolvedValue(Buffer.from("pdf")),
      },
    );

    await service.run(createMockPool(), {
      stage: "sop.pdf_export",
      pipeline_id: pipelineId,
      step_code: "03-A",
      artifact_id: artifactId,
    });

    expect(uploadPdfBuffer).toHaveBeenCalledWith(expectedKey, expect.any(Buffer));
    expect(expectedKey).toBe(
      `${ownerId}/sops/${pipelineId}/${artifactId}.pdf`,
    );
  });
});
