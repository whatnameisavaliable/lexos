import type { ErrorCode as ErrorCodeType } from "../api/error-code.js";

/**
 * 跨层业务错误（shared / Worker）；API 层可映射为 {@link AppHttpError}。
 */
export class LexosError extends Error {
  constructor(
    readonly code: ErrorCodeType,
    message: string,
    readonly details?: Readonly<Record<string, unknown>>,
  ) {
    super(message);
    this.name = "LexosError";
  }
}
