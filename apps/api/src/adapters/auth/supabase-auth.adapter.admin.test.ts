import { describe, expect, it, vi } from "vitest";
import { SupabaseAuthAdapter } from "./supabase-auth.adapter.js";

describe("SupabaseAuthAdapter admin APIs", () => {
  const adminAuth = {
    createUser: vi.fn(),
    updateUserById: vi.fn(),
    deleteUser: vi.fn(),
  };
  const rpc = vi.fn();

  const adapter = new SupabaseAuthAdapter(
    {
      supabaseUrl: "https://example.supabase.co",
      supabaseAnonKey: "anon",
      supabaseServiceRoleKey: "service_role_secret",
    },
    { authVirtualEmailDomain: "llexos.internal" },
  );

  (
    adapter as unknown as {
      adminClient: { auth: { admin: typeof adminAuth }; rpc: typeof rpc };
    }
  ).adminClient = { auth: { admin: adminAuth }, rpc };

  it("adminCreateUser returns userId without logging password", async () => {
    adminAuth.createUser.mockResolvedValue({
      data: { user: { id: "uid-1" } },
      error: null,
    });

    const result = await adapter.adminCreateUser(
      "lawyer@llexos.internal",
      "initial-secret",
    );

    expect(result.userId).toBe("uid-1");
    expect(adminAuth.createUser).toHaveBeenCalledWith({
      email: "lawyer@llexos.internal",
      password: "initial-secret",
      email_confirm: true,
    });
    expect(JSON.stringify(adminAuth.createUser.mock.calls)).not.toMatch(
      /service_role_secret/,
    );
  });

  it("adminSignOutGlobal revokes sessions via RPC", async () => {
    rpc.mockResolvedValue({ error: null });
    await adapter.adminSignOutGlobal("uid-1");
    expect(rpc).toHaveBeenCalledWith("admin_revoke_user_sessions", {
      p_user_id: "uid-1",
    });
  });
});
