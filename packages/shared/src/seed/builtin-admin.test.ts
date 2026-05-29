import { describe, expect, it, vi } from "vitest";
import {
  buildBuiltinAdminProfile,
  findAuthUserIdByEmail,
  getBuiltinAdminVirtualEmail,
  seedBuiltinAdmin,
} from "./builtin-admin.js";

describe("getBuiltinAdminVirtualEmail", () => {
  it("uses AUTH_VIRTUAL_EMAIL_DOMAIN from config", () => {
    expect(
      getBuiltinAdminVirtualEmail({
        builtinAdminUsername: "admin",
        authVirtualEmailDomain: "llexos.internal",
      }),
    ).toBe("admin@llexos.internal");
  });
});

describe("buildBuiltinAdminProfile", () => {
  it("sets requires_password_change true per PRD A3", () => {
    const profile = buildBuiltinAdminProfile("00000000-0000-4000-8000-000000000001");
    expect(profile.username).toBe("admin");
    expect(profile.requiresPasswordChange).toBe(true);
  });
});

describe("findAuthUserIdByEmail", () => {
  it("returns matching user id", async () => {
    const client = {
      auth: {
        admin: {
          listUsers: vi.fn().mockResolvedValue({
            data: {
              users: [{ id: "uid-1", email: "admin@llexos.internal" }],
            },
            error: null,
          }),
        },
      },
    };
    const id = await findAuthUserIdByEmail(
      client as never,
      "admin@llexos.internal",
    );
    expect(id).toBe("uid-1");
  });
});

describe("seedBuiltinAdmin", () => {
  it("creates auth user and upserts profile when missing", async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    const createUser = vi.fn().mockResolvedValue({
      data: { user: { id: "new-uid" } },
      error: null,
    });
    const listUsers = vi.fn().mockResolvedValue({
      data: { users: [] },
      error: null,
    });

    const client = {
      auth: { admin: { listUsers, createUser } },
      from: vi.fn().mockReturnValue({ upsert }),
    };

    const result = await seedBuiltinAdmin(client as never, {
      authVirtualEmailDomain: "llexos.internal",
      authInitialPassword: "initial-secret",
      builtinAdminUsername: "admin",
    });

    expect(result.createdAuthUser).toBe(true);
    expect(createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "admin@llexos.internal",
        password: "initial-secret",
      }),
    );
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "new-uid",
        username: "admin",
        requires_password_change: true,
        role: "admin",
      }),
      { onConflict: "id" },
    );
  });

  it("skips createUser when auth user already exists", async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    const createUser = vi.fn();
    const listUsers = vi.fn().mockResolvedValue({
      data: { users: [{ id: "existing", email: "admin@llexos.internal" }] },
      error: null,
    });

    const client = {
      auth: { admin: { listUsers, createUser } },
      from: vi.fn().mockReturnValue({ upsert }),
    };

    const result = await seedBuiltinAdmin(client as never, {
      authVirtualEmailDomain: "llexos.internal",
      authInitialPassword: "initial-secret",
      builtinAdminUsername: "admin",
    });

    expect(result.createdAuthUser).toBe(false);
    expect(createUser).not.toHaveBeenCalled();
  });
});
