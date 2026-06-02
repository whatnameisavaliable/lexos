import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { parseSopUploadCompleteBody } from "./sop-upload-complete.dto.js";

describe("sopUploadCompleteBodySchema", () => {
  it("parses valid uploadSessionId", () => {
    const id = "00000000-0000-4000-8000-000000000099";
    const body = parseSopUploadCompleteBody({ uploadSessionId: id });
    expect(body.uploadSessionId).toBe(id);
  });

  it("rejects invalid uploadSessionId", () => {
    expect(() =>
      parseSopUploadCompleteBody({ uploadSessionId: "bad" }),
    ).toThrow(ZodError);
  });
});
