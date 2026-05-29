import {
  createApiSuccess,
  type ApiSuccessResponse,
} from "@lexos/shared/api";
import type { HealthCheckReport, HealthCheckService } from "../services/health-check.service.js";

/** HTTP 层健康检查响应载荷。 */
export interface HealthHttpResult {
  readonly statusCode: number;
  readonly body: ApiSuccessResponse<HealthCheckReport>;
}

/**
 * `GET /health` Controller（仅映射 HTTP 状态码，不含 IO）。
 */
export class HealthController {
  constructor(private readonly healthCheckService: HealthCheckService) {}

  /**
   * @param requestId - 由中间件注入的请求 ID
   */
  async getHealth(requestId: string): Promise<HealthHttpResult> {
    const report = await this.healthCheckService.runChecks();
    const statusCode =
      report.status === "unhealthy" ? 503 : 200;

    return {
      statusCode,
      body: createApiSuccess(report, { requestId }),
    };
  }
}
