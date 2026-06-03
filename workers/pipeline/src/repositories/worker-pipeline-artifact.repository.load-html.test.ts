import { describe, expect, it, vi } from "vitest";
import { WorkerPipelineArtifactRepository } from "./worker-pipeline-artifact.repository.js";

describe("WorkerPipelineArtifactRepository.loadFinalizedSnapshotHtml", () => {
  const repo = new WorkerPipelineArtifactRepository();

  it("prefers finalized_snapshot_raw over content_raw", async () => {
    const client = {
      query: vi.fn().mockResolvedValue({
        rows: [
          {
            finalized_snapshot_raw: "<html>snapshot</html>",
            content_raw: "<html>draft</html>",
          },
        ],
      }),
    };

    const html = await repo.loadFinalizedSnapshotHtml(client as never, "art-1");
    expect(html).toBe("<html>snapshot</html>");
  });

  it("falls back to content_raw when snapshot is empty", async () => {
    const client = {
      query: vi.fn().mockResolvedValue({
        rows: [
          {
            finalized_snapshot_raw: "   ",
            content_raw: "<html>draft</html>",
          },
        ],
      }),
    };

    const html = await repo.loadFinalizedSnapshotHtml(client as never, "art-1");
    expect(html).toBe("<html>draft</html>");
  });

  it("returns null when artifact not found", async () => {
    const client = {
      query: vi.fn().mockResolvedValue({ rows: [] }),
    };

    const html = await repo.loadFinalizedSnapshotHtml(
      client as never,
      "missing",
    );
    expect(html).toBeNull();
  });
});
