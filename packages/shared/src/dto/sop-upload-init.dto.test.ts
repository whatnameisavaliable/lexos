import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { MAX_SIZE_BYTES } from "../lib/transcription-limits.js";
import { parseSopUploadInitBody } from "./sop-upload-init.dto.js";

describe("sopUploadInitBodySchema", () => {
  const validBase = {
    pipelineId: "00000000-0000-4000-8000-000000000010",
    fileName: "evidence.mp3",
    mimeType: "audio/mpeg",
    sizeBytes: 1024,
  };

  it("parses valid body with optional durationSec", () => {
    const body = parseSopUploadInitBody({
      ...validBase,
      durationSec: 3600,
    });
    expect(body.pipelineId).toBe(validBase.pipelineId);
    expect(body.mimeType).toBe("audio/mpeg");
    expect(body.sizeBytes).toBe(1024n);
    expect(body.durationSec).toBe(3600);
  });

  it("rejects size over 1GB", () => {
    expect(() =>
      parseSopUploadInitBody({
        ...validBase,
        sizeBytes: MAX_SIZE_BYTES + 1,
      }),
    ).toThrow(ZodError);
  });
});
