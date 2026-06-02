import {
  assertContextWithinModelWindow,
  estimateTokenCount,
  LexosError,
} from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { AppHttpError } from "../middleware/error-handler.middleware.js";

/**
 * 校验 SOP 组装后 Prompt 不超过模型上下文窗口（禁止截断）。
 */
export function assertSopPromptWithinModelWindow(
  assembledPrompt: string,
  systemPrompt: string,
  contextWindow: number,
): void {
  const totalTokens =
    estimateTokenCount(assembledPrompt) + estimateTokenCount(systemPrompt);
  try {
    assertContextWithinModelWindow(totalTokens, contextWindow);
  } catch (err) {
    if (err instanceof LexosError && err.code === ErrorCode.CONTEXT_LIMIT_EXCEEDED) {
      throw new AppHttpError(
        ErrorCode.CONTEXT_LIMIT_EXCEEDED,
        err.message,
        err.details,
      );
    }
    throw err;
  }
}
