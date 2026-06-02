import { SOP_STAGE_PDF_EXPORT } from "@lexos/shared";
import { describe, expect, it } from "vitest";
import { buildSopPdfExportOutboxPayload } from "./build-sop-pdf-export-outbox-payload.js";

describe("buildSopPdfExportOutboxPayload", () => {
  it("sets stage sop.pdf_export and artifact_id", () => {
    const payload = buildSopPdfExportOutboxPayload({
      pipelineId: "p-1",
      stepCode: "03",
      artifactId: "a-1",
    });
    expect(payload.stage).toBe(SOP_STAGE_PDF_EXPORT);
    expect(payload.artifact_id).toBe("a-1");
  });
});
