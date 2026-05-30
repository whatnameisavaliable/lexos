import { describe, expect, it } from "vitest";
import { ErrorCode } from "@lexos/shared/api";
import {
  assertFileHasParent,
  assertNotRootFileCreate,
  DriveNodeRuleError,
} from "./drive-node-rules.js";

describe("drive-node-rules", () => {
  it("rejects root file create with VALIDATION_FAILED", () => {
    expect(() => assertNotRootFileCreate("file", null)).toThrow(DriveNodeRuleError);
    try {
      assertNotRootFileCreate("file", null);
    } catch (err) {
      expect((err as DriveNodeRuleError).code).toBe(ErrorCode.VALIDATION_FAILED);
    }
  });

  it("allows folder at root", () => {
    expect(() => assertNotRootFileCreate("folder", null)).not.toThrow();
  });

  it("assertFileHasParent rejects null parent", () => {
    expect(() => assertFileHasParent(null)).toThrow(DriveNodeRuleError);
  });
});
