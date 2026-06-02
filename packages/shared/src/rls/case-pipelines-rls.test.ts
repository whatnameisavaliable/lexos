import { createClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import {
  CASE_PIPELINES_TABLE,
  fetchCasePipelineAsUser,
} from "./case-pipelines-rls.js";

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(),
}));

describe("fetchCasePipelineAsUser", () => {
  it("queries case_pipelines table", async () => {
    const maybeSingle = vi
      .fn()
      .mockResolvedValue({ data: null, error: null });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });

    vi.mocked(createClient).mockReturnValue({ from } as never);

    await fetchCasePipelineAsUser(
      "https://example.supabase.co",
      "anon-key",
      "token",
      "pipeline-id",
    );

    expect(CASE_PIPELINES_TABLE).toBe("case_pipelines");
    expect(from).toHaveBeenCalledWith("case_pipelines");
    expect(eq).toHaveBeenCalledWith("id", "pipeline-id");
  });
});
