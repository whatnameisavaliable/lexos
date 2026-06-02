import { beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { SopUploadSessionRepository } from "./sop-upload-session.repository.js";
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

describe("SopUploadSessionRepository", () => {
  beforeEach(() => {
    vi.mocked(createClient).mockClear();
    mockFrom.mockReset();
  });

  it("create inserts pipeline_id with null task_id", async () => {
    const chain = createSupabaseQueryChain({
      data: {
        id: "sess-1",
        pipeline_id: "pipe-1",
        owner_id: "lawyer-1",
        storage_key_prefix: "lawyer-1/sops/pipe-1/",
        expected_max_bytes: 1000,
        expires_at: "2026-06-02T00:00:00.000Z",
        completed_at: null,
        created_at: "2026-06-01T00:00:00.000Z",
      },
      error: null,
    });
    mockFrom.mockReturnValue(chain);

    const repo = new SopUploadSessionRepository(supabaseEnv);
    const session = await repo.create("token", {
      pipelineId: "pipe-1",
      ownerId: "lawyer-1",
      storageKeyPrefix: "lawyer-1/sops/pipe-1/",
      expectedMaxBytes: 1000,
    });

    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        task_id: null,
        pipeline_id: "pipe-1",
      }),
    );
    expect(session.pipelineId).toBe("pipe-1");
  });

  it("findOpenByPipelineId filters null task_id and open sessions", async () => {
    const chain = createSupabaseQueryChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    const repo = new SopUploadSessionRepository(supabaseEnv);
    await repo.findOpenByPipelineId("token", "pipe-1");

    expect(chain.eq).toHaveBeenCalledWith("pipeline_id", "pipe-1");
    expect(chain.is).toHaveBeenCalledWith("task_id", null);
    expect(chain.is).toHaveBeenCalledWith("completed_at", null);
  });
});
