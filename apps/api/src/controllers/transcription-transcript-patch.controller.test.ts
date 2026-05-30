import { describe, expect, it, vi } from "vitest";
import { createAuthContext } from "@lexos/shared";
import { TranscriptionTranscriptPatchController } from "./transcription-transcript-patch.controller.js";
import { runWithRequestContext } from "../middleware/request-context.js";

describe("TranscriptionTranscriptPatchController", () => {
  it("requires If-Match header", async () => {
    const service = { patch: vi.fn() };
    const controller = new TranscriptionTranscriptPatchController(
      service as never,
      "x-request-id",
    );

    await expect(
      runWithRequestContext(
        {
          requestId: "r1",
          method: "PATCH",
          path: "/api/transcription/tasks/t1/transcript",
          accessToken: "token",
          auth: createAuthContext({
            userId: "u1",
            role: "lawyer",
            username: "l",
            requiresPasswordChange: false,
          }),
        },
        () =>
          controller.handle(
            {
              headers: {},
              async *[Symbol.asyncIterator]() {
                yield Buffer.from(JSON.stringify({ polishedText: "x" }));
              },
            } as never,
            { setHeader: vi.fn(), end: vi.fn() } as never,
            { id: "t1" },
          ),
      ),
    ).rejects.toMatchObject({ code: "VALIDATION_FAILED" });
  });

  it("returns patched transcript with ETag", async () => {
    const service = {
      patch: vi.fn().mockResolvedValue({
        taskId: "t1",
        polishedText: "updated",
        version: 4,
        updatedAt: "2026-01-01T00:00:00.000Z",
      }),
    };
    const controller = new TranscriptionTranscriptPatchController(
      service as never,
      "x-request-id",
    );

    const setHeader = vi.fn();
    let body = "";
    const res = {
      setHeader,
      end: (chunk: string) => {
        body = chunk;
      },
    } as never;

    await runWithRequestContext(
      {
        requestId: "r1",
        method: "PATCH",
        path: "/api/transcription/tasks/t1/transcript",
        accessToken: "token",
        auth: createAuthContext({
          userId: "u1",
          role: "lawyer",
          username: "l",
          requiresPasswordChange: false,
        }),
      },
      () =>
        controller.handle(
          {
            headers: { "if-match": "3" },
            async *[Symbol.asyncIterator]() {
              yield Buffer.from(JSON.stringify({ polishedText: "updated" }));
            },
          } as never,
          res,
          { id: "t1" },
        ),
    );

    expect(setHeader).toHaveBeenCalledWith("ETag", "4");
    expect(JSON.parse(body).data.version).toBe(4);
  });
});
