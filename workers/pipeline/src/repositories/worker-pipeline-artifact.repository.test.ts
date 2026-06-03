import { describe, expect, it } from "vitest";
import {
  WorkerPipelineArtifactRepository,
  type WorkerPipelineArtifactRecord,
} from "./worker-pipeline-artifact.repository.js";

describe("WorkerPipelineArtifactRepository (skeleton)", () => {
  it("exports repository class and record type", () => {
    const repo = new WorkerPipelineArtifactRepository();
    expect(repo).toBeInstanceOf(WorkerPipelineArtifactRepository);
    expect(typeof repo.findArtifactById).toBe("function");
    expect(typeof repo.setArtifactStatus).toBe("function");
    expect(typeof repo.setContentRaw).toBe("function");
    expect(typeof repo.setLinkedDriveNodeId).toBe("function");
    expect(typeof repo.loadFinalizedSnapshotHtml).toBe("function");
  });

  it("WorkerPipelineArtifactRecord shape is readonly", () => {
    const record: WorkerPipelineArtifactRecord = {
      id: "a1",
      pipelineId: "p1",
      stepCode: "01-A",
      contentType: "markdown",
      contentRaw: "",
      version: 1,
      status: "draft",
      linkedDriveNodeId: null,
      finalizedSnapshotRaw: null,
    };
    expect(record.stepCode).toBe("01-A");
  });
});
