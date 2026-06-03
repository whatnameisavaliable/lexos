import { describe, expect, it, vi } from "vitest";
import { AuthErrorCode } from "@lexos/shared";
import { createAuthContext } from "@lexos/shared";
import { requireRoles } from "../middleware/role-gate.factory.js";
import { runWithRequestContext } from "../middleware/request-context.js";
import { SopTemplatesListController } from "./sop-templates-list.controller.js";
import { handleSopsRoute } from "../routes/sops.routes.js";

describe("SopTemplatesListController", () => {
  it("returns published templates list", async () => {
    const service = {
      list: vi.fn().mockResolvedValue({ items: [{ templateVersionId: "v1" }] }),
    };
    const controller = new SopTemplatesListController(service as never, "x-request-id");

    let body = "";
    const res = {
      statusCode: 0,
      setHeader: () => undefined,
      end: (chunk: string) => {
        body = chunk;
      },
    } as never;

    await runWithRequestContext(
      {
        requestId: "r1",
        method: "GET",
        path: "/api/sops/templates",
        accessToken: "token",
        auth: createAuthContext({
          userId: "u1",
          role: "lawyer",
          username: "l",
          requiresPasswordChange: false,
        }),
      },
      () => controller.handle({ url: "/api/sops/templates", headers: {} } as never, res),
    );

    expect(JSON.parse(body).success).toBe(true);
    expect(JSON.parse(body).data.items).toHaveLength(1);
  });

  it("rejects admin role at lawyer SOP gate", () => {
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
});

describe("handleSopsRoute lawyer gate (via requireRoles)", () => {
  it("dispatches GET /api/sops/templates for lawyer handlers", async () => {
    const templatesList = { handle: vi.fn().mockResolvedValue(undefined) };
    const noop = { handle: vi.fn() };
    const handled = await handleSopsRoute(
      { method: "GET" } as never,
      {} as never,
      "/api/sops/templates",
      {
        templatesList: templatesList as never,
        uploadsInit: noop as never,
        uploadsComplete: noop as never,
        pipelinesCreate: noop as never,
        pipelinesStatus: noop as never,
        pipelinesResume: noop as never,
        pipelinesClose: noop as never,
        stepExecute: noop as never,
        stepFinalize: noop as never,
        artifactGet: noop as never,
        artifactPatch: noop as never,
        artifactVerify: noop as never,
        artifactRegeneratePdf: noop as never,
      },
    );
    expect(handled).toBe(true);
    expect(templatesList.handle).toHaveBeenCalled();
  });
});
