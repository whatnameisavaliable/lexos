import { describe, expect, it, vi } from "vitest";
import { AdminUserRepository } from "./admin-user.repository.js";
import {
  decodeListCursor,
  encodeListCursor,
  mapAdminUserListItem,
} from "./admin-user.types.js";

function createQueryChain(finalResult: { data: unknown; error: unknown; count?: number }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  const methods = [
    "select",
    "order",
    "eq",
    "or",
    "limit",
    "range",
    "insert",
    "update",
    "maybeSingle",
    "single",
  ] as const;

  for (const method of methods) {
    chain[method] = vi.fn().mockReturnValue(chain);
  }

  chain.then = vi.fn((resolve: (v: unknown) => void) => {
    resolve(finalResult);
    return Promise.resolve(finalResult);
  }) as unknown as ReturnType<typeof vi.fn>;

  Object.defineProperty(chain, "then", {
    value: (onFulfilled: (v: unknown) => unknown) =>
      Promise.resolve(finalResult).then(onFulfilled),
  });

  return chain;
}

describe("admin-user.types", () => {
  it("round-trips list cursor", () => {
    const token = encodeListCursor("2024-01-01T00:00:00.000Z", "uuid-1");
    expect(decodeListCursor(token)).toEqual({
      createdAt: "2024-01-01T00:00:00.000Z",
      id: "uuid-1",
    });
  });

  it("maps list item without service_role fields", () => {
    const item = mapAdminUserListItem({
      id: "u1",
      username: "lawyer",
      display_name: "律师",
      role: "lawyer",
      contact: null,
      status: "enabled",
      requires_password_change: false,
      mfa_enabled: true,
      created_at: "2024-01-01T00:00:00.000Z",
      updated_at: "2024-01-01T00:00:00.000Z",
    });
    expect(item.mfaEnabled).toBe(true);
    expect(item.createdAt).toBe("2024-01-01T00:00:00.000Z");
  });
});

describe("AdminUserRepository", () => {
  it("does not expose service_role in listUsers result payload", async () => {
    const rows = [
      {
        id: "u1",
        username: "a",
        display_name: "A",
        role: "lawyer",
        contact: null,
        status: "enabled",
        requires_password_change: false,
        mfa_enabled: false,
        created_at: "2024-01-01T00:00:00.000Z",
        updated_at: "2024-01-01T00:00:00.000Z",
      },
    ];
    const chain = createQueryChain({ data: rows, error: null });
    const from = vi.fn().mockReturnValue(chain);
    const repo = new AdminUserRepository({ from } as never);

    const result = await repo.listUsers({ limit: 50 });
    expect(JSON.stringify(result)).not.toMatch(/service_role/i);
  });

  it("countEnabledAdmins queries admin+enabled", async () => {
    const chain = createQueryChain({ data: null, error: null, count: 2 });
    const from = vi.fn().mockReturnValue(chain);
    const repo = new AdminUserRepository({ from } as never);

    const count = await repo.countEnabledAdmins();

    expect(count).toBe(2);
    expect(chain.eq).toHaveBeenCalledWith("role", "admin");
    expect(chain.eq).toHaveBeenCalledWith("status", "enabled");
  });

  it("findUserByUsername returns null when missing", async () => {
    const chain = createQueryChain({ data: null, error: null });
    chain.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const from = vi.fn().mockReturnValue(chain);
    const repo = new AdminUserRepository({ from } as never);

    const profile = await repo.findUserByUsername("missing");
    expect(profile).toBeNull();
  });

  it("listUsers returns nextCursor when more than limit", async () => {
    const rows = [
      {
        id: "u2",
        username: "b",
        display_name: "B",
        role: "lawyer",
        contact: null,
        status: "enabled",
        requires_password_change: false,
        mfa_enabled: false,
        created_at: "2024-02-01T00:00:00.000Z",
        updated_at: "2024-02-01T00:00:00.000Z",
      },
      {
        id: "u1",
        username: "a",
        display_name: "A",
        role: "lawyer",
        contact: null,
        status: "enabled",
        requires_password_change: false,
        mfa_enabled: false,
        created_at: "2024-01-01T00:00:00.000Z",
        updated_at: "2024-01-01T00:00:00.000Z",
      },
    ];
    const chain = createQueryChain({ data: rows, error: null });
    const from = vi.fn().mockReturnValue(chain);
    const repo = new AdminUserRepository({ from } as never);

    const result = await repo.listUsers({ limit: 1 });

    expect(result.items).toHaveLength(1);
    expect(result.nextCursor).toBe(
      encodeListCursor("2024-02-01T00:00:00.000Z", "u2"),
    );
  });
});
