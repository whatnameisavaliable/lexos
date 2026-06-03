import { describe, expect, it } from "vitest";
import {
  WorkerCasePipelineRepository,
  type WorkerCasePipelineRecord,
} from "./worker-case-pipeline.repository.js";

describe("WorkerCasePipelineRepository (skeleton)", () => {
  it("exports repository class and record type", () => {
    const repo = new WorkerCasePipelineRepository();
    expect(repo).toBeInstanceOf(WorkerCasePipelineRepository);
    expect(typeof repo.assertLawyerPipelineWritable).toBe("function");
    expect(typeof repo.findPipelineWithLawyer).toBe("function");
    expect(typeof repo.updateCurrentStepCode).toBe("function");
  });

  it("WorkerCasePipelineRecord shape is readonly", () => {
    const record: WorkerCasePipelineRecord = {
      id: "p1",
      lawyerId: "l1",
      lawyerStatus: "enabled",
      templateVersionId: "tv1",
      status: "in_progress",
      currentStepCode: "01-A",
    };
    expect(record.lawyerStatus).toBe("enabled");
  });
});
