import { createClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mapAuditLogRow } from "./audit-log-read.types.js";

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(),
}));

const supabaseEnv = {
  supabaseUrl: "https://example.supabase.co",
  supabaseAnonKey: "anon-key",
  supabaseServiceRoleKey: "service-key",
} as const;

const mockFrom = vi.fn();

function createQueryChain(finalResult: { data: unknown; error: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  const methods = [
    "select",
    "order",
    "eq",
    "gte",
    "lte",
    "or",
    "limit",
    "maybeSingle",
  ] as const;
  for (const method of methods) {
    chain[method] = vi.fn(() => chain);
  }
  chain.limit = vi.fn(() => Promise.resolve(finalResult));
  chain.maybeSingle = vi.fn(() => Promise.resolve(finalResult));
  return chain;
}

describe("mapAuditLogRow", () => {
  it("maps metadata client_timestamp to clientTimestamp", () => {
    const item = mapAuditLogRow({
      id: "a1",
      actor_id: null,
      action: "auth.login_failure",
      target_type: null,
      target_id: null,
      ip_address: "127.0.0.1",
      user_agent: null,
      metadata: {
        attempted_username: "alice",
        client_timestamp: "2026-05-31T00:00:00.000Z",
      },
      row_hash: "abc",
      created_at: "2026-05-31T01:00:00.000Z",
    });
    expect(item.metadata.clientTimestamp).toBe("2026-05-31T00:00:00.000Z");
    expect(item.metadata.attempted_username).toBe("alice");
  });
});

describe("AuditLogReadRepository", () => {
  beforeEach(() => {
    vi.mocked(createClient).mockClear();
    mockFrom.mockReset();
    vi.mocked(createClient).mockReturnValue({ from: mockFrom } as never);
  });

  it("list returns empty when lawyer JWT has no RLS rows", async () => {
    const chain = createQueryChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    const { AuditLogReadRepository } = await import(
      "./audit-log-read.repository.js"
    );
    const repo = new AuditLogReadRepository(supabaseEnv);
    const result = await repo.list("lawyer-b-token", { limit: 50 });

    expect(result.items).toEqual([]);
    expect(mockFrom).toHaveBeenCalledWith("audit_logs");
  });
});
