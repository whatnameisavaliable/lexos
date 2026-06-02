import { PipelineArtifactStatus } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { LexosError } from "@lexos/shared";
import { describe, expect, it } from "vitest";
import { assertDependsOnFinalized } from "./assert-depends-on-finalized.js";

describe("assertDependsOnFinalized", () => {
  it("passes when all dependencies are finalized", () => {
    expect(() =>
      assertDependsOnFinalized(
        "pipe-1",
        { stepCode: "02", dependsOn: ["01"] },
        { "01": { status: PipelineArtifactStatus.FINALIZED } },
      ),
    ).not.toThrow();
  });

  it("throws OPERATION_NOT_ALLOWED when upstream is draft", () => {
    try {
      assertDependsOnFinalized(
        "pipe-1",
        { stepCode: "02", dependsOn: ["01"] },
        { "01": { status: PipelineArtifactStatus.DRAFT } },
      );
      expect.fail("expected throw");
    } catch (e) {
      expect(e).toBeInstanceOf(LexosError);
      expect((e as LexosError).code).toBe(ErrorCode.OPERATION_NOT_ALLOWED);
    }
  });
});
