/**
 * LexOS U2 API 入口（M0-D 最小集）。
 */
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import {
  loadAppRuntimeEnv,
  parseApiListenPort,
  resolveRepoRoot,
} from "@lexos/shared/config";
import { RedisHealthAdapter } from "./adapters/redis-health.adapter.js";
import { HealthController } from "./controllers/health.controller.js";
import { PostgresHealthRepository } from "./repositories/postgres-health.repository.js";
import { handleHealthRoute } from "./routes/health.routes.js";
import { HealthCheckService } from "./services/health-check.service.js";

const repoRoot = resolveRepoRoot();
const env = loadAppRuntimeEnv(repoRoot);
const port = parseApiListenPort(env.apiUrl);

const healthController = new HealthController(
  new HealthCheckService(
    new PostgresHealthRepository(env.supabaseDbUrl),
    new RedisHealthAdapter(env.redisUrl),
  ),
);

const server = createServer((req: IncomingMessage, res: ServerResponse) => {
  if (handleHealthRoute(req, res, healthController, env.requestIdHeader)) {
    return;
  }

  if (!res.writableEnded) {
    res.statusCode = 404;
    res.setHeader("content-type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ success: false, error: { code: "RESOURCE_NOT_FOUND" } }));
  }
});

server.listen(port, () => {
  console.log(`LexOS API listening on ${env.apiUrl} (NODE_ENV=${env.nodeEnv})`);
});

export { server };
