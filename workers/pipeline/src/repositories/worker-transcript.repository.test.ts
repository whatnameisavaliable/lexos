import { describe, expect, it, vi } from "vitest";
import { WorkerTranscriptRepository } from "./worker-transcript.repository.js";

describe("WorkerTranscriptRepository", () => {
  it("upserts transcript fields", async () => {
    const client = {
      query: vi.fn().mockResolvedValue({ rowCount: 1 }),
    };
    const repo = new WorkerTranscriptRepository();
    await repo.upsertTranscript(client as never, {
      taskId: "task-1",
      polishedText: "润色文本",
      summaryText: "摘要",
    });
    expect(client.query).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO public.transcription_transcripts"),
      expect.arrayContaining(["task-1", null, "润色文本", "摘要"]),
    );
  });
});
