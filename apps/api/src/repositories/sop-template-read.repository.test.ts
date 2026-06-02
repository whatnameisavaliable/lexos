import { beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { SopTemplateReadRepository } from "./sop-template-read.repository.js";
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

describe("SopTemplateReadRepository.listPublishedTemplates", () => {
  beforeEach(() => {
    vi.mocked(createClient).mockClear();
    mockFrom.mockReset();
  });

  it("filters is_published and maps nested template fields", async () => {
    const chain = createSupabaseQueryChain({
      data: [
        {
          id: "ver-1",
          version_number: 2,
          published_at: "2026-06-01T00:00:00.000Z",
          sop_templates: { name: "民事 SOP", case_type: "civil" },
        },
      ],
      error: null,
    });
    mockFrom.mockReturnValue(chain);

    const repo = new SopTemplateReadRepository(supabaseEnv);
    const result = await repo.listPublishedTemplates("lawyer-token", { limit: 50 });

    expect(mockFrom).toHaveBeenCalledWith("sop_template_versions");
    expect(chain.eq).toHaveBeenCalledWith("is_published", true);
    expect(result.items[0]).toEqual({
      templateVersionId: "ver-1",
      templateName: "民事 SOP",
      caseType: "civil",
      versionNumber: 2,
    });
    expect(result.nextCursor).toBeUndefined();
  });
});
