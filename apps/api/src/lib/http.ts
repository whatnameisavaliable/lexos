import type { IncomingMessage, ServerResponse } from "node:http";
import { createApiSuccess, type ApiSuccessResponse } from "@lexos/shared/api";
import { getRequestContext } from "../middleware/request-context.js";

/**
 * 读取 JSON 请求体；空体返回 `undefined`。
 */
export async function readJsonBody<T>(req: IncomingMessage): Promise<T> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) {
    return undefined as T;
  }
  return JSON.parse(raw) as T;
}

/**
 * 写入成功 JSON 响应。
 */
export function sendJsonSuccess<T>(
  res: ServerResponse,
  statusCode: number,
  data: T,
  requestIdHeader: string,
): void {
  const requestId = getRequestContext()?.requestId ?? "unknown";
  const body: ApiSuccessResponse<T> = createApiSuccess(data, { requestId });
  res.statusCode = statusCode;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader(requestIdHeader, requestId);
  res.end(JSON.stringify(body));
}

/** 从请求提取客户端 IP（反向代理可扩展）。 */
export function getClientIp(req: IncomingMessage): string | undefined {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0]?.trim();
  }
  return req.socket?.remoteAddress ?? undefined;
}

export function getUserAgent(req: IncomingMessage): string | undefined {
  const ua = req.headers["user-agent"];
  return typeof ua === "string" ? ua : undefined;
}
