/**
 * LexOS U2 API 入口（M1-F 认证与个人中心路由）。
 */
import { createServer } from "node:http";
import { parseApiListenPort, resolveRepoRoot } from "@lexos/shared/config";
import { createLexosApiAppFromEnv } from "./app.js";

const repoRoot = resolveRepoRoot();
const app = createLexosApiAppFromEnv(repoRoot);
const port = parseApiListenPort(app.env.apiUrl);

const server = createServer((req, res) => {
  app.handleRequest(req, res);
});

server.listen(port, () => {
  console.log(
    `LexOS API listening on ${app.env.apiUrl} (NODE_ENV=${app.env.nodeEnv})`,
  );
});

export { server, app };
