import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { parseTranscriptionTaskListQuery } from "./transcription-task-list-query.dto.js";

describe("transcriptionTaskListQuerySchema", () => {
  it("defaults limit to 50", () => {
    const query = parseTranscriptionTaskListQuery({});
    expect(query.limit).toBe(50);
  });

  it("clamps limit to max 50", () => {
    const query = parseTranscriptionTaskListQuery({ limit: "100" });
    expect(query.limit).toBe(50);
  });

  it("accepts status filter and cursor", () => {
    const query = parseTranscriptionTaskListQuery({
      status: "queued",
      cursor: "2024-01-01T00:00:00.000Z|uuid",
    });
    expect(query.status).toBe("queued");
    expect(query.cursor).toBeDefined();
  });

  it("rejects unknown query keys", () => {
    expect(() =>
      parseTranscriptionTaskListQuery({ offset: 0 } as Record<string, unknown>),
    ).toThrow(ZodError);
  });
});
