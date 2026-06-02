import { CasePipelineStatus } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { LexosError } from "@lexos/shared";
import { describe, expect, it } from "vitest";
import { assertPipelineActionable } from "./assert-pipeline-actionable.js";

describe("assertPipelineActionable", () => {
  it("allows in_progress", () => {
    expect(() =>
      assertPipelineActionable(CasePipelineStatus.IN_PROGRESS),
    ).not.toThrow();
  });

  it("rejects completed with OPERATION_NOT_ALLOWED", () => {
    try {
      assertPipelineActionable(CasePipelineStatus.COMPLETED);
      expect.fail("expected throw");
    } catch (e) {
      expect(e).toBeInstanceOf(LexosError);
      expect((e as LexosError).code).toBe(ErrorCode.OPERATION_NOT_ALLOWED);
    }
  });

  it("rejects suspended with OPERATION_NOT_ALLOWED", () => {
    try {
      assertPipelineActionable(CasePipelineStatus.SUSPENDED);
      expect.fail("expected throw");
    } catch (e) {
      expect(e).toBeInstanceOf(LexosError);
      expect((e as LexosError).code).toBe(ErrorCode.OPERATION_NOT_ALLOWED);
    }
  });
});
