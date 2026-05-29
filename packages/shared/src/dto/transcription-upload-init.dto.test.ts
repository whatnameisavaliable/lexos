import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { MAX_SIZE_BYTES } from "../lib/transcription-limits.js";
import { parseTranscriptionUploadInitBody } from "./transcription-upload-init.dto.js";

describe("transcriptionUploadInitBodySchema", () => {
  const validBase = {
    title: "庭审录音",
    fileName: "hearing.mp3",
    mimeType: "audio/mpeg",
    sizeBytes: 1024,
  };

  it("parses valid body with optional fields", () => {
    const body = parseTranscriptionUploadInitBody({
      ...validBase,
      durationSec: 3600,
      idempotencyKey: "idem-1",
    });
    expect(body.title).toBe("庭审录音");
    expect(body.mimeType).toBe("audio/mpeg");
    expect(body.sizeBytes).toBe(1024n);
    expect(body.durationSec).toBe(3600);
    expect(body.idempotencyKey).toBe("idem-1");
  });

  it("normalizes mimeType to lowercase", () => {
    const body = parseTranscriptionUploadInitBody({
      ...validBase,
      mimeType: "VIDEO/MP4",
      fileName: "trial.mp4",
    });
    expect(body.mimeType).toBe("video/mp4");
  });

  it("rejects size over 1GB", () => {
    expect(() =>
      parseTranscriptionUploadInitBody({
        ...validBase,
        sizeBytes: MAX_SIZE_BYTES + 1,
      }),
    ).toThrow(ZodError);
  });

  it("rejects unsupported mimeType", () => {
    expect(() =>
      parseTranscriptionUploadInitBody({
        ...validBase,
        mimeType: "application/pdf",
      }),
    ).toThrow(ZodError);
  });

  it("rejects duration over 5 hours", () => {
    expect(() =>
      parseTranscriptionUploadInitBody({
        ...validBase,
        durationSec: 18_001,
      }),
    ).toThrow(ZodError);
  });
});
