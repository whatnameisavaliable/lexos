import { beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { SopStepSnapshotRepository } from "./sop-step-snapshot.repository.js";
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

describe("SopStepSnapshotRepository.listStepsByTemplateVersionId", () => {
  beforeEach(() => {
    vi.mocked(createClient).mockClear();
    mockFrom.mockReset();
  });

  it("reads sop_steps ordered by step_code", async () => {
    const chain = createSupabaseQueryChain({
      data: [
        {
          id: "step-1",
          template_version_id: "ver-1",
          step_code: "01-A",
          name: "事实梳理",
          execution_type: "sync_llm",
          ai_feature_key: "sop.fact_extract",
          prompt_template_id: null,
          input_schema: {},
          depends_on: [],
          requires_verification: false,
          created_at: "2026-06-01T00:00:00.000Z",
        },
      ],
      error: null,
    });
    mockFrom.mockReturnValue(chain);

    const repo = new SopStepSnapshotRepository(supabaseEnv);
    const steps = await repo.listStepsByTemplateVersionId("token", "ver-1");

    expect(mockFrom).toHaveBeenCalledWith("sop_steps");
    expect(chain.eq).toHaveBeenCalledWith("template_version_id", "ver-1");
    expect(chain.order).toHaveBeenCalledWith("step_code", { ascending: true });
    expect(steps[0]?.stepCode).toBe("01-A");
  });
});
