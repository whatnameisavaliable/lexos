import { describe, expect, it, vi } from "vitest";
import { createAuthContext } from "@lexos/shared";
import { DriveRootService } from "./drive-root.service.js";

describe("DriveRootService", () => {
  it("returns existing root id", async () => {
    const repo = {
      findRootByUser: vi.fn().mockResolvedValue({ id: "root-1" }),
      createRootFolder: vi.fn(),
    };
    const service = new DriveRootService(repo as never);
    const actor = createAuthContext({
      userId: "u1",
      role: "lawyer",
      username: "l",
      requiresPasswordChange: false,
    });

    const result = await service.getOrCreateRoot(actor, "token");
    expect(result.rootId).toBe("root-1");
    expect(repo.createRootFolder).not.toHaveBeenCalled();
  });

  it("creates root when missing", async () => {
    const repo = {
      findRootByUser: vi
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null),
      createRootFolder: vi.fn().mockResolvedValue({ id: "root-new" }),
    };
    const service = new DriveRootService(repo as never);
    const actor = createAuthContext({
      userId: "u1",
      role: "lawyer",
      username: "l",
      requiresPasswordChange: false,
    });

    const result = await service.getOrCreateRoot(actor, "token");
    expect(result.rootId).toBe("root-new");
  });
});
