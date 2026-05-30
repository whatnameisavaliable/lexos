import { describe, expect, it, vi } from "vitest";
import { WorkerSegmentRepository } from "./worker-segment.repository.js";

describe("WorkerSegmentRepository", () => {
  it("calls upsert_task_segments RPC", async () => {
    const client = {
      query: vi.fn().mockResolvedValue({ rows: [{ upsert_task_segments: 2 }] }),
    };
    const repo = new WorkerSegmentRepository();
    const count = await repo.upsertTaskSegments(client as never, "task-1", [
      { segmentIndex: 0, startMs: 0, endMs: 900_000, chunkSizeBytes: 512 },
    ]);
    expect(count).toBe(2);
    expect(client.query).toHaveBeenCalledWith(
      expect.stringContaining("upsert_task_segments"),
      ["task-1", expect.any(String)],
    );
  });
});
