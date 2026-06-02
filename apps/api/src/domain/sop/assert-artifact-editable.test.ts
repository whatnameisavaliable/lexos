import { PipelineArtifactStatus } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { LexosError } from "@lexos/shared";
import { describe, expect, it } from "vitest";
import { assertArtifactEditable } from "./assert-artifact-editable.js";

describe("assertArtifactEditable", () => {
  it("allows draft", () => {
    expect(() =>
      assertArtifactEditable(PipelineArtifactStatus.DRAFT),
    ).not.toThrow();
  });

  it("rejects finalized", () => {
    try {
      assertArtifactEditable(PipelineArtifactStatus.FINALIZED);
      expect.fail("expected throw");
    } catch (e) {
      expect(e).toBeInstanceOf(LexosError);
      expect((e as LexosError).code).toBe(ErrorCode.OPERATION_NOT_ALLOWED);
    }
  });
});
