import { describe, expect, it, vi } from "vitest";
import { CasePipelineStatus } from "@lexos/shared";
import { WorkerCasePipelineRepository } from "./worker-case-pipeline.repository.js";

describe("WorkerCasePipelineRepository.findPipelineWithLawyer", () => {
  const repo = new WorkerCasePipelineRepository();

  it("maps pipeline row with lawyer status", async () => {
    const client = {
      query: vi.fn().mockResolvedValue({
        rows: [
          {
            id: "pipe-1",
            lawyer_id: "lawyer-1",
            lawyer_status: "enabled",
            template_version_id: "tv-1",
            status: CasePipelineStatus.IN_PROGRESS,
            current_step_code: "02-B",
          },
        ],
      }),
    };

    const result = await repo.findPipelineWithLawyer(client as never, "pipe-1");

    expect(result).toEqual({
      id: "pipe-1",
      lawyerId: "lawyer-1",
      lawyerStatus: "enabled",
      templateVersionId: "tv-1",
      status: CasePipelineStatus.IN_PROGRESS,
      currentStepCode: "02-B",
    });
    expect(client.query).toHaveBeenCalledWith(
      expect.stringContaining("FROM public.case_pipelines cp"),
      ["pipe-1"],
    );
  });

  it("returns null when pipeline not found", async () => {
    const client = {
      query: vi.fn().mockResolvedValue({ rows: [] }),
    };

    const result = await repo.findPipelineWithLawyer(client as never, "missing");
    expect(result).toBeNull();
  });
});

describe("WorkerCasePipelineRepository.updateCurrentStepCode", () => {
  const repo = new WorkerCasePipelineRepository();

  it("updates current_step_code", async () => {
    const client = {
      query: vi.fn().mockResolvedValue({ rowCount: 1 }),
    };

    await repo.updateCurrentStepCode(client as never, "pipe-1", "03-C");

    expect(client.query).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE public.case_pipelines"),
      ["pipe-1", "03-C"],
    );
  });

  it("throws when update affects zero rows", async () => {
    const client = {
      query: vi.fn().mockResolvedValue({ rowCount: 0 }),
    };

    await expect(
      repo.updateCurrentStepCode(client as never, "missing", "03-C"),
    ).rejects.toThrow(/updateCurrentStepCode failed/);
  });
});
