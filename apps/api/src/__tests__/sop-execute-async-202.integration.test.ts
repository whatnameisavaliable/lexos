import { describe, expect, it, vi } from "vitest";
import { CasePipelineStatus, createAuthContext, SopExecutionType } from "@lexos/shared";
import { SopStepExecuteService } from "../services/sop-step-execute.service.js";

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

describe("sop execute async 202 (integration mock)", () => {
  it("Deep Research step execute returns 202 and outbox insert is invoked", async () => {
    const pipelineId = "p1";
    const stepCode = "01";
    const artifactId = "a1";

    mockConnect.mockResolvedValue({
      query: mockQuery.mockResolvedValue({ rows: [{ id: artifactId }] }),
      release: mockRelease,
    });

    const insertOutbox = vi.fn().mockResolvedValue("o1");
    const service = new SopStepExecuteService(
      { supabaseDbUrl: "postgres://localhost/db" } as never,
      {
        findPipelineForLawyer: vi.fn().mockResolvedValue({
          id: pipelineId,
          lawyerId: "u1",
          templateVersionId: "tv1",
          status: CasePipelineStatus.IN_PROGRESS,
        }),
        updateCurrentStepCode: vi.fn(),
      } as never,
      {
        listStepsByTemplateVersionId: vi.fn().mockResolvedValue([
          {
            stepCode,
            dependsOn: [],
            executionType: SopExecutionType.ASYNC_DEEP_RESEARCH,
          },
        ]),
      } as never,
      { findArtifactByStep: vi.fn().mockResolvedValue(null) } as never,
      { insertSopOutboxInTransaction: insertOutbox } as never,
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

    const result = await service.execute(actor, "token", pipelineId, stepCode, {
      formValues: {},
    });

    expect(result.statusCode).toBe(202);
    expect(result.data).toMatchObject({
      pipelineId,
      stepCode,
      artifactId,
    });
    expect(insertOutbox).toHaveBeenCalled();
  });
});
