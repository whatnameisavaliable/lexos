import { describe, expect, it, vi } from "vitest";
import {
  ArtifactContentType,
  PipelineArtifactStatus,
} from "@lexos/shared";
import { WorkerPipelineArtifactRepository } from "./worker-pipeline-artifact.repository.js";

describe("WorkerPipelineArtifactRepository mutations", () => {
  const repo = new WorkerPipelineArtifactRepository();

  it("findArtifactById maps snake_case columns", async () => {
    const client = {
      query: vi.fn().mockResolvedValue({
        rows: [
          {
            id: "art-1",
            pipeline_id: "pipe-1",
            step_code: "04-D",
            content_type: ArtifactContentType.MARKDOWN,
            content_raw: "# draft",
            version: 2,
            status: PipelineArtifactStatus.DRAFT,
            linked_drive_node_id: null,
            finalized_snapshot_raw: null,
          },
        ],
      }),
    };

    const artifact = await repo.findArtifactById(client as never, "art-1");

    expect(artifact).toEqual({
      id: "art-1",
      pipelineId: "pipe-1",
      stepCode: "04-D",
      contentType: ArtifactContentType.MARKDOWN,
      contentRaw: "# draft",
      version: 2,
      status: PipelineArtifactStatus.DRAFT,
      linkedDriveNodeId: null,
      finalizedSnapshotRaw: null,
    });
  });

  it("setArtifactStatus updates status enum", async () => {
    const client = {
      query: vi.fn().mockResolvedValue({ rowCount: 1 }),
    };

    await repo.setArtifactStatus(
      client as never,
      "art-1",
      PipelineArtifactStatus.FAILED,
    );

    expect(client.query).toHaveBeenCalledWith(
      expect.stringContaining("pipeline_artifact_status"),
      ["art-1", PipelineArtifactStatus.FAILED],
    );
  });

  it("setContentRaw updates content_raw", async () => {
    const client = {
      query: vi.fn().mockResolvedValue({ rowCount: 1 }),
    };

    await repo.setContentRaw(client as never, "art-1", "updated body");

    expect(client.query).toHaveBeenCalledWith(
      expect.stringContaining("content_raw = $2"),
      ["art-1", "updated body"],
    );
  });

  it("setLinkedDriveNodeId updates linked_drive_node_id", async () => {
    const client = {
      query: vi.fn().mockResolvedValue({ rowCount: 1 }),
    };

    await repo.setLinkedDriveNodeId(client as never, "art-1", "node-1");

    expect(client.query).toHaveBeenCalledWith(
      expect.stringContaining("linked_drive_node_id"),
      ["art-1", "node-1"],
    );
  });

  it("throws when mutation affects zero rows", async () => {
    const client = {
      query: vi.fn().mockResolvedValue({ rowCount: 0 }),
    };

    await expect(
      repo.setArtifactStatus(
        client as never,
        "missing",
        PipelineArtifactStatus.DRAFT,
      ),
    ).rejects.toThrow(/setArtifactStatus failed/);
  });
});
