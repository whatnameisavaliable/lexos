import type { IncomingMessage, ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";
import type { HealthController } from "../controllers/health.controller.js";

/**
 * 注册 `GET /health` 路由处理。
 */
/**
 * @returns 是否已处理该请求
 */
export function handleHealthRoute(
  req: IncomingMessage,
  res: ServerResponse,
  controller: HealthController,
  requestIdHeader: string,
): boolean {
  if (req.method !== "GET" || req.url?.split("?")[0] !== "/health") {
    return false;
  }

  const requestId =
    (req.headers[requestIdHeader] as string | undefined)?.trim() ||
    randomUUID();

  void controller
    .getHealth(requestId)
    .then((result) => {
      res.statusCode = result.statusCode;
      res.setHeader("content-type", "application/json; charset=utf-8");
      res.setHeader(requestIdHeader, requestId);
      res.end(JSON.stringify(result.body));
    })
    .catch(() => {
      res.statusCode = 500;
      res.setHeader("content-type", "application/json; charset=utf-8");
      res.end(
        JSON.stringify({
          success: false,
          error: {
            code: "INTERNAL_ERROR",
            message: "Health check failed",
            requestId,
          },
        }),
      );
    });

  return true;
}
