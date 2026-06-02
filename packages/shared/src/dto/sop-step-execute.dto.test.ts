import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { parseSopStepExecuteBody } from "./sop-step-execute.dto.js";

describe("sopStepExecuteBodySchema", () => {
  it("parses formValues and mediaObjectKeys", () => {
    const body = parseSopStepExecuteBody({
      formValues: { plaintiff: "甲" },
      mediaObjectKeys: ["uid/sops/pipe/file.pdf"],
    });
    expect(body.formValues).toEqual({ plaintiff: "甲" });
    expect(body.mediaObjectKeys).toEqual(["uid/sops/pipe/file.pdf"]);
  });

  it("defaults formValues to empty object when omitted", () => {
    const body = parseSopStepExecuteBody({});
    expect(body.formValues).toEqual({});
    expect(body.mediaObjectKeys).toBeUndefined();
  });

  it("rejects empty media object key", () => {
    expect(() =>
      parseSopStepExecuteBody({ mediaObjectKeys: [""] }),
    ).toThrow(ZodError);
  });
});
