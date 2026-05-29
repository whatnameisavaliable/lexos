import { AsyncLocalStorage } from "node:async_hooks";
import type { AuthContext } from "@lexos/shared";
import type { ProfileRecord } from "../repositories/profile.types.js";

/**
 * 单次 HTTP 请求上下文（经中间件链注入）。
 */
export interface RequestContext {
  readonly requestId: string;
  readonly method: string;
  readonly path: string;
  readonly accessToken?: string;
  readonly auth?: AuthContext;
  readonly profile?: ProfileRecord;
}

const storage = new AsyncLocalStorage<RequestContext>();

/**
 * 在 AsyncLocalStorage 作用域内运行处理器。
 */
export function runWithRequestContext<T>(
  context: RequestContext,
  fn: () => T,
): T {
  return storage.run(context, fn);
}

/** 获取当前请求上下文；无则 `undefined`。 */
export function getRequestContext(): RequestContext | undefined {
  return storage.getStore();
}

/** 必须存在请求上下文时调用。 */
export function requireRequestContext(): RequestContext {
  const ctx = getRequestContext();
  if (!ctx) {
    throw new Error("RequestContext is not available outside middleware chain");
  }
  return ctx;
}
