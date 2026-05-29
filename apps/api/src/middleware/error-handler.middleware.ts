import type { ServerResponse } from "node:http";
import {
  createApiError,
  ERROR_CODE_HTTP_STATUS,
  ErrorCode,
  isErrorCode,
  type ErrorCode as ErrorCodeType,
} from "@lexos/shared/api";
import { getRequestContext } from "./request-context.js";

/**
 * 将业务错误码映射为 HTTP 状态（`architecture.md` §6.2）。
 */
export function httpStatusForErrorCode(code: ErrorCodeType): number {
  return ERROR_CODE_HTTP_STATUS[code] ?? 500;
}

/**
 * 写入统一失败 JSON 响应（`architecture.md` §6.1）。
 */
export function sendApiError(
  res: ServerResponse,
  code: ErrorCodeType,
  message: string,
  requestId?: string,
  details?: Readonly<Record<string, unknown>>,
): void {
  const rid = requestId ?? getRequestContext()?.requestId ?? "unknown";
  const status = httpStatusForErrorCode(code);

  if (!res.headersSent) {
    res.statusCode = status;
    res.setHeader("content-type", "application/json; charset=utf-8");
  }

  res.end(
    JSON.stringify(
      createApiError({
        code,
        message,
        requestId: rid,
        ...(details ? { details } : {}),
      }),
    ),
  );
}

/**
 * 包装异步路由：捕获异常并映射为统一错误体。
 */
export async function withErrorHandler(
  res: ServerResponse,
  handler: () => Promise<void>,
): Promise<void> {
  try {
    await handler();
  } catch (err) {
    if (res.writableEnded) {
      return;
    }

    const requestId = getRequestContext()?.requestId;
    if (err instanceof AppHttpError) {
      sendApiError(res, err.code, err.message, requestId, err.details);
      return;
    }

    const code =
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      typeof (err as { code: unknown }).code === "string" &&
      isErrorCode((err as { code: string }).code)
        ? ((err as { code: string }).code as ErrorCodeType)
        : ErrorCode.INTERNAL_ERROR;

    const message =
      err instanceof Error ? err.message : "Internal server error";

    sendApiError(res, code, message, requestId);
  }
}

/** Controller/Service 可抛出的 HTTP 层错误。 */
export class AppHttpError extends Error {
  constructor(
    readonly code: ErrorCodeType,
    message: string,
    readonly details?: Readonly<Record<string, unknown>>,
  ) {
    super(message);
    this.name = "AppHttpError";
  }
}
