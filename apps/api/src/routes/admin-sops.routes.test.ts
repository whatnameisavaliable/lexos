import { describe, expect, it, vi } from "vitest";
import { AuthErrorCode } from "@lexos/shared";
import { requireRoles } from "../middleware/role-gate.factory.js";
import { runWithRequestContext } from "../middleware/request-context.js";
import { handleAdminSopsRoute } from "./admin-sops.routes.js";

function createHandler() {
  return { handle: vi.fn().mockResolvedValue(undefined) };
}

describe("handleAdminSopsRoute", () => {
  const handlers = {
    list: createHandler(),
    templateCreate: createHandler(),
    templateGet: createHandler(),
    versionGet: createHandler(),
    versionPromptsUpsert: createHandler(),
    versionCreate: createHandler(),
    versionPublish: createHandler(),
    previewPipeline: createHandler(),
  };

  it("dispatches GET /api/admin/sops", async () => {
    const req = { method: "GET" } as never;
    const res = {} as never;
    const handled = await handleAdminSopsRoute(
      req,
      res,
      "/api/admin/sops",
      handlers,
    );
    expect(handled).toBe(true);
    expect(handlers.list.handle).toHaveBeenCalled();
  });

  it("rejects lawyer role at admin gate", () => {
    let statusCode = 0;
    let body = "";
    const res = {
      get statusCode() {
        return statusCode;
      },
      set statusCode(v: number) {
        statusCode = v;
      },
      setHeader: () => undefined,
      writableEnded: false,
      end: (chunk: string) => {
        body = chunk;
      },
    } as never;

    const requireAdmin = requireRoles("admin");
    const allowed = runWithRequestContext(
      {
        requestId: "r1",
        method: "GET",
        path: "/api/admin/sops",
        auth: {
          userId: "lawyer",
          role: "lawyer",
          username: "lawyer",
          requiresPasswordChange: false,
        },
      },
      () => requireAdmin(res),
    );

    expect(allowed).toBe(false);
    expect(JSON.parse(body).error.code).toBe(AuthErrorCode.AUTH_FORBIDDEN);
  });

  it("returns false for unknown paths", async () => {
    const handled = await handleAdminSopsRoute(
      { method: "GET" } as never,
      {} as never,
      "/api/admin/sops/unknown",
      handlers,
    );
    expect(handled).toBe(false);
  });
});
