import { beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { TranscriptionTaskRepository } from "./transcription-task.repository.js";

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

function createQueryChain(finalResult: { data: unknown; error: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  const methods = [
    "select",
    "insert",
    "eq",
    "is",
    "order",
    "limit",
    "or",
    "maybeSingle",
    "single",
  ] as const;

  for (const method of methods) {
    chain[method] = vi.fn().mockReturnValue(chain);
  }

  Object.defineProperty(chain, "then", {
    value: (onFulfilled: (v: unknown) => unknown) =>
      Promise.resolve(finalResult).then(onFulfilled),
  });

  return chain;
}

describe("TranscriptionTaskRepository", () => {
  beforeEach(() => {
    vi.mocked(createClient).mockClear();
    mockFrom.mockReset();
  });

  it("findById returns null when RLS hides another user's task", async () => {
    const chain = createQueryChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    const repo = new TranscriptionTaskRepository(supabaseEnv);
    const row = await repo.findById(
      "lawyer-b-token",
      "00000000-0000-4000-8000-000000000099",
    );

    expect(row).toBeNull();
    expect(mockFrom).toHaveBeenCalledWith("transcription_tasks");
    expect(chain.eq).toHaveBeenCalledWith(
      "id",
      "00000000-0000-4000-8000-000000000099",
    );
  });

  it("findById returns mapped task for visible row", async () => {
    const chain = createQueryChain({
      data: {
        id: "task-1",
        created_by: "user-1",
        title: "访谈",
        status: "uploading",
        source_mime: "audio/mpeg",
        source_storage_key: "user-1/task-1/a.mp3",
        audio_storage_key: null,
        duration_sec: 60,
        size_bytes: 1000,
        is_mp4: false,
        asr_queue_tier: null,
        idempotency_key: null,
        diarization_degraded: false,
        deleted_at: null,
        created_at: "2024-01-01T00:00:00.000Z",
        updated_at: "2024-01-01T00:00:00.000Z",
      },
      error: null,
    });
    mockFrom.mockReturnValue(chain);

    const repo = new TranscriptionTaskRepository(supabaseEnv);
    const row = await repo.findById("lawyer-a-token", "task-1");

    expect(row?.createdBy).toBe("user-1");
    expect(row?.status).toBe("uploading");
  });
});
