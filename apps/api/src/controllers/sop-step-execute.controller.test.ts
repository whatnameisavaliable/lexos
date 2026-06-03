import { Readable } from "node:stream";
import type { IncomingMessage } from "node:http";
import { describe, expect, it, vi } from "vitest";
import { createAuthContext } from "@lexos/shared";
import { SopStepExecuteController } from "./sop-step-execute.controller.js";
import { runWithRequestContext } from "../middleware/request-context.js";

describe("SopStepExecuteController", () => {
  it("returns 202 for async deep research execute", async () => {
    const service = {
      execute: vi.fn().mockResolvedValue({
        statusCode: 202,
        data: {
          pipelineId: "p1",
          stepCode: "research",
          artifactId: "a1",
        },
      }),
    };
    const controller = new SopStepExecuteController(service as never, "x-request-id");

    const req = Readable.from([Buffer.from("{}")]) as IncomingMessage;
    req.headers = {};

    let body = "";
    let statusCode = 0;
    const res = {
      get statusCode() {
        return statusCode;
      },
      set statusCode(v: number) {
        statusCode = v;
      },
      setHeader: () => undefined,
      end: (chunk: string) => {
        body = chunk;
      },
    } as never;

    await runWithRequestContext(
      {
        requestId: "r1",
        method: "POST",
        path: "/api/sops/pipelines/p1/steps/research/execute",
        accessToken: "token",
        auth: createAuthContext({
          userId: "u1",
          role: "lawyer",
          username: "l",
          requiresPasswordChange: false,
        }),
      },
      () => controller.handle(req, res, { id: "p1", code: "research" }),
    );

    expect(statusCode).toBe(202);
    expect(JSON.parse(body).data.artifactId).toBe("a1");
  });
});
