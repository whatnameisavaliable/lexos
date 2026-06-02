import { ErrorCode } from "../api/error-code.js";
import { LexosError } from "../errors/lexos-error.js";

/**
 * 断言上下文 Token 总量不超过模型窗口；超限抛 `CONTEXT_LIMIT_EXCEEDED`（禁止截断）。
 */
export function assertContextWithinModelWindow(
  totalTokens: number,
  contextWindow: number,
): void {
  if (totalTokens > contextWindow) {
    throw new LexosError(
      ErrorCode.CONTEXT_LIMIT_EXCEEDED,
      "Prompt exceeds model context window",
      { totalTokens, contextWindow },
    );
  }
}
