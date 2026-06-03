import { describe, expect, it } from "vitest";
import type {
  SopArtifactDetail,
  SopPipelineCreateResult,
  SopTemplatesListData,
} from "./lawyer-sops-api.types.js";

describe("lawyer-sops-api.types", () => {
  it("constructs template list row", () => {
    const row: SopTemplatesListData["items"][number] = {
      templateVersionId: "00000000-0000-4000-8000-000000000002",
      templateName: "民事",
      caseType: "civil",
      versionNumber: 1,
    };
    expect(row.versionNumber).toBe(1);
  });

  it("constructs pipeline create result", () => {
    const pipeline: SopPipelineCreateResult = {
      id: "00000000-0000-4000-8000-000000000003",
      lawyerId: "00000000-0000-4000-8000-000000000004",
      templateVersionId: "00000000-0000-4000-8000-000000000002",
      status: "in_progress",
      currentStepCode: "01",
      createdAt: "2026-01-01T00:00:00.000Z",
    };
    expect(pipeline.status).toBe("in_progress");
  });

  it("constructs artifact detail", () => {
    const artifact: SopArtifactDetail = {
      id: "00000000-0000-4000-8000-000000000005",
      pipelineId: "00000000-0000-4000-8000-000000000003",
      stepCode: "01",
      contentType: "json",
      contentRaw: "{}",
      version: 1,
      status: "draft",
      linkedDriveNodeId: null,
      finalizedSnapshotRaw: null,
      updatedBy: null,
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    expect(artifact.contentType).toBe("json");
  });
});
