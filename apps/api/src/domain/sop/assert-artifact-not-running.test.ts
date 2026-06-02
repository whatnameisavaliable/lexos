import { PipelineArtifactStatus } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { LexosError } from "@lexos/shared";
import { describe, expect, it } from "vitest";
import { assertArtifactNotRunning } from "./assert-artifact-not-running.js";

describe("assertArtifactNotRunning", () => {
  it("allows draft and null", () => {
    expect(() =>
      assertArtifactNotRunning(PipelineArtifactStatus.DRAFT),
    ).not.toThrow();
    expect(() => assertArtifactNotRunning(null)).not.toThrow();
  });

  it("rejects running", () => {
    try {
      assertArtifactNotRunning(PipelineArtifactStatus.RUNNING);
      expect.fail("expected throw");
    } catch (e) {
      expect(e).toBeInstanceOf(LexosError);
      expect((e as LexosError).code).toBe(ErrorCode.OPERATION_NOT_ALLOWED);
    }
  });
});
