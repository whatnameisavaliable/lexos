import { randomUUID } from "node:crypto";
import type { IncomingMessage } from "node:http";
import {
  getRequestContext,
  runWithRequestContext,
  type RequestContext,
} from "./request-context.js";

/**
 * 从请求头读取或生成 `requestId`，并建立 {@link RequestContext} 作用域。
 */
export function withRequestId(
  req: IncomingMessage,
  requestIdHeader: string,
  handler: () => void | Promise<void>,
): void | Promise<void> {
  const path = req.url?.split("?")[0] ?? "/";
  const requestId =
    (req.headers[requestIdHeader] as string | undefined)?.trim() || randomUUID();

  const base: RequestContext = {
    requestId,
    method: req.method ?? "GET",
    path,
  };

  return runWithRequestContext(base, () => handler());
}

/**
 * 获取当前请求的 `requestId`（须已执行 {@link withRequestId}）。
 */
export function getRequestId(): string {
  return requireRequestContextFromMiddleware().requestId;
}

function requireRequestContextFromMiddleware(): RequestContext {
  const ctx = getRequestContext();
  if (!ctx) {
    throw new Error("withRequestId must wrap the handler");
  }
  return ctx;
}
