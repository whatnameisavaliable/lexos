import { describe, expect, it, vi } from "vitest";
import { CasePipelineStatus, createAuthContext, SopExecutionType } from "@lexos/shared";
import { SopStepExecuteService } from "./sop-step-execute.service.js";

const mockConnect = vi.fn();
const mockQuery = vi.fn();
const mockRelease = vi.fn();

vi.mock("pg", () => ({
  default: {
    Pool: vi.fn(() => ({
      connect: mockConnect,
    })),
  },
}));

describe("SopStepExecuteService async", () => {
  it("returns 202 with artifact_id for async_deep_research", async () => {
    mockConnect.mockResolvedValue({
      query: mockQuery.mockResolvedValue({ rows: [{ id: "a1" }] }),
      release: mockRelease,
    });
    const service = new SopStepExecuteService(
      { supabaseDbUrl: "postgres://localhost/db" } as never,
      {
        findPipelineForLawyer: vi.fn().mockResolvedValue({
          id: "p1",
          lawyerId: "u1",
          templateVersionId: "tv1",
          status: CasePipelineStatus.IN_PROGRESS,
        }),
        updateCurrentStepCode: vi.fn(),
      } as never,
      {
        listStepsByTemplateVersionId: vi.fn().mockResolvedValue([
          {
            stepCode: "01",
            dependsOn: [],
            executionType: SopExecutionType.ASYNC_DEEP_RESEARCH,
          },
        ]),
      } as never,
      { findArtifactByStep: vi.fn().mockResolvedValue(null) } as never,
      { insertSopOutboxInTransaction: vi.fn().mockResolvedValue("o1") } as never,
      { assertDeepResearchEnabled: vi.fn().mockResolvedValue(undefined) } as never,
      {} as never,
      {} as never,
    );
    const actor = createAuthContext({
      userId: "u1",
      role: "lawyer",
      username: "lawyer1",
      requiresPasswordChange: false,
    });
    const result = await service.execute(actor, "token", "p1", "01", { formValues: {} });
    expect(result.statusCode).toBe(202);
    expect((result.data as { artifactId: string }).artifactId).toBe("a1");
  });
});
