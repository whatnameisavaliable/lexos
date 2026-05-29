import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { parseTranscriptionUploadCompleteBody } from "./transcription-upload-complete.dto.js";

describe("transcriptionUploadCompleteBodySchema", () => {
  it("parses valid uploadSessionId", () => {
    const sessionId = "550e8400-e29b-41d4-a716-446655440000";
    const body = parseTranscriptionUploadCompleteBody({
      uploadSessionId: sessionId,
    });
    expect(body.uploadSessionId).toBe(sessionId);
  });

  it("rejects non-uuid uploadSessionId", () => {
    expect(() =>
      parseTranscriptionUploadCompleteBody({ uploadSessionId: "not-a-uuid" }),
    ).toThrow(ZodError);
  });
});
