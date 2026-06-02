import { beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { CasePipelineRepository } from "./case-pipeline.repository.js";
import { createSupabaseQueryChain } from "./supabase-query-chain.mock.js";

const supabaseEnv = {
  supabaseUrl: "https://example.supabase.co",
  supabaseAnonKey: "anon-key",
  supabaseServiceRoleKey: "service-role-key",
  supabaseJwtSecret: "jwt-secret",
  supabaseDbUrl: "postgres://localhost/db",
};

const mockFrom = vi.fn();

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

describe("CasePipelineRepository.createPipeline", () => {
  beforeEach(() => {
    vi.mocked(createClient).mockClear();
    mockFrom.mockReset();
  });

  it("inserts in_progress pipeline with entry step", async () => {
    const chain = createSupabaseQueryChain({
      data: {
        id: "pipe-1",
        lawyer_id: "lawyer-1",
        template_version_id: "ver-1",
        status: "in_progress",
        current_step_code: "01-A",
        created_at: "2026-06-01T00:00:00.000Z",
      },
      error: null,
    });
    mockFrom.mockReturnValue(chain);

    const repo = new CasePipelineRepository(supabaseEnv);
    const row = await repo.createPipeline(
      "token",
      "ver-1",
      "lawyer-1",
      "01-A",
    );

    expect(mockFrom).toHaveBeenCalledWith("case_pipelines");
    expect(chain.insert).toHaveBeenCalledWith({
      lawyer_id: "lawyer-1",
      template_version_id: "ver-1",
      status: "in_progress",
      current_step_code: "01-A",
    });
    expect(row.currentStepCode).toBe("01-A");
    expect(row.status).toBe("in_progress");
  });
});
