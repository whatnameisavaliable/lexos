import { describe, expect, it } from "vitest";
import { sopExecuteErrorToastMessage } from "./sop-execute-errors.js";

describe("sopExecuteErrorToastMessage", () => {
  it("returns null for unknown codes", () => {
    expect(sopExecuteErrorToastMessage("OTHER")).toBeNull();
  });
});
