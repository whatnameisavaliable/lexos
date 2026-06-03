import { describe, expect, it } from "vitest";
import { sopExecuteErrorToastMessage } from "@/lib/sop-execute-errors";

describe("sopExecuteErrorToastMessage", () => {
  it("maps OPERATION_NOT_ALLOWED", () => {
    expect(sopExecuteErrorToastMessage("OPERATION_NOT_ALLOWED")).toContain(
      "不允许",
    );
  });

  it("maps CONTEXT_LIMIT_EXCEEDED", () => {
    expect(sopExecuteErrorToastMessage("CONTEXT_LIMIT_EXCEEDED")).toContain(
      "上下文",
    );
  });
});
