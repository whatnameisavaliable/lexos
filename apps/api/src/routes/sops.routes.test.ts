import { AuthErrorCode } from "@lexos/shared";
import { describe, expect, it, vi } from "vitest";
import { createAuthContext } from "@lexos/shared";
import { requireRoles } from "../middleware/role-gate.factory.js";
import { runWithRequestContext } from "../middleware/request-context.js";
import { handleSopsRoute } from "./sops.routes.js";

function createHandler() {
  return { handle: vi.fn().mockResolvedValue(undefined) };
}

describe("handleSopsRoute", () => {
  const handlers = {
    templatesList: createHandler(),
    uploadsInit: createHandler(),
    uploadsComplete: createHandler(),
    pipelinesCreate: createHandler(),
    pipelinesStatus: createHandler(),
    pipelinesResume: createHandler(),
    pipelinesClose: createHandler(),
    stepExecute: createHandler(),
    stepFinalize: createHandler(),
    artifactGet: createHandler(),
    artifactPatch: createHandler(),
    artifactVerify: createHandler(),
    artifactRegeneratePdf: createHandler(),
  };

  it("dispatches POST /api/sops/pipelines", async () => {
    const handled = await handleSopsRoute(
      { method: "POST" } as never,
      {} as never,
      "/api/sops/pipelines",
      handlers,
    );
    expect(handled).toBe(true);
    expect(handlers.pipelinesCreate.handle).toHaveBeenCalled();
  });

  it("dispatches GET /api/sops/pipelines/:id/status", async () => {
    const handled = await handleSopsRoute(
      { method: "GET" } as never,
      {} as never,
      "/api/sops/pipelines/00000000-0000-4000-8000-000000000001/status",
      handlers,
    );
    expect(handled).toBe(true);
    expect(handlers.pipelinesStatus.handle).toHaveBeenCalled();
  });

  it("rejects admin role at lawyer gate", () => {
    let body = "";
    const res = {
      get statusCode() {
        return 403;
      },
      set statusCode(_v: number) {
        /* noop */
      },
      setHeader: () => undefined,
      writableEnded: false,
      end: (chunk: string) => {
        body = chunk;
      },
    } as never;

    const requireLawyer = requireRoles("lawyer");
    const allowed = runWithRequestContext(
      {
        requestId: "r1",
        method: "GET",
        path: "/api/sops/templates",
        auth: createAuthContext({
          userId: "admin",
          role: "admin",
          username: "admin",
          requiresPasswordChange: false,
        }),
      },
      () => requireLawyer(res),
    );

    expect(allowed).toBe(false);
    expect(JSON.parse(body).error.code).toBe(AuthErrorCode.AUTH_FORBIDDEN);
  });

  it("rejects unauthenticated context at lawyer gate", () => {
    let body = "";
    const res = {
      get statusCode() {
        return 403;
      },
      set statusCode(_v: number) {
        /* noop */
      },
      setHeader: () => undefined,
      writableEnded: false,
      end: (chunk: string) => {
        body = chunk;
      },
    } as never;

    const requireLawyer = requireRoles("lawyer");
    const allowed = runWithRequestContext(
      {
        requestId: "r1",
        method: "GET",
        path: "/api/sops/templates",
      },
      () => requireLawyer(res),
    );

    expect(allowed).toBe(false);
    expect(JSON.parse(body).error.code).toBe(AuthErrorCode.AUTH_FORBIDDEN);
  });

  it("returns false for unknown paths", async () => {
    const handled = await handleSopsRoute(
      { method: "GET" } as never,
      {} as never,
      "/api/sops/unknown",
      handlers,
    );
    expect(handled).toBe(false);
  });
});
