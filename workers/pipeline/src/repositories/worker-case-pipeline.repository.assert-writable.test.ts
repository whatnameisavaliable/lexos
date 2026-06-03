import { describe, expect, it, vi } from "vitest";
import { WorkerCasePipelineRepository } from "./worker-case-pipeline.repository.js";

describe("WorkerCasePipelineRepository.assertLawyerPipelineWritable", () => {
  const repo = new WorkerCasePipelineRepository();

  it("passes when pipeline exists and lawyer is enabled", async () => {
    const client = {
      query: vi.fn().mockResolvedValue({
        rows: [
          {
            id: "pipe-1",
            lawyer_id: "lawyer-1",
            lawyer_status: "enabled",
            template_version_id: "tv-1",
            status: "in_progress",
            current_step_code: "01-A",
          },
        ],
      }),
    };

    await expect(
      repo.assertLawyerPipelineWritable(client as never, "pipe-1"),
    ).resolves.toBeUndefined();
  });

  it("throws when pipeline not found", async () => {
    const client = {
      query: vi.fn().mockResolvedValue({ rows: [] }),
    };

    await expect(
      repo.assertLawyerPipelineWritable(client as never, "missing"),
    ).rejects.toThrow(/case_pipelines not found/);
  });

  it("throws when lawyer profile is missing or deleted", async () => {
    const client = {
      query: vi.fn().mockResolvedValue({
        rows: [
          {
            id: "pipe-1",
            lawyer_id: "lawyer-1",
            lawyer_status: null,
            template_version_id: "tv-1",
            status: "in_progress",
            current_step_code: null,
          },
        ],
      }),
    };

    await expect(
      repo.assertLawyerPipelineWritable(client as never, "pipe-1"),
    ).rejects.toThrow(/lawyer profile missing or deleted/);
  });

  it("throws when lawyer profile is disabled", async () => {
    const client = {
      query: vi.fn().mockResolvedValue({
        rows: [
          {
            id: "pipe-1",
            lawyer_id: "lawyer-1",
            lawyer_status: "disabled",
            template_version_id: "tv-1",
            status: "in_progress",
            current_step_code: null,
          },
        ],
      }),
    };

    await expect(
      repo.assertLawyerPipelineWritable(client as never, "pipe-1"),
    ).rejects.toThrow(/lawyer profile not enabled/);
  });
});
