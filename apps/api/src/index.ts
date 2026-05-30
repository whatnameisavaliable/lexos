/**
 * LexOS U2 API 入口（M1-F 认证与个人中心路由）。
 */
import { execSync } from "node:child_process";
import { createServer, type Server } from "node:http";
import path from "node:path";
import { parseApiListenPort, resolveRepoRoot } from "@lexos/shared/config";
import { createLexosApiAppFromEnv } from "./app.js";

const repoRoot = resolveRepoRoot();
const app = createLexosApiAppFromEnv(repoRoot);
const port = parseApiListenPort(app.env.apiUrl);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** 开发环境仅在端口占用时释放，避免 tsx watch 重启时误杀正在处理请求的进程。 */
function freeListenPortInDev(): void {
  if (process.env.NODE_ENV === "production") {
    return;
  }
  const script = path.join(repoRoot, "scripts", "kill-listen-port.mjs");
  try {
    execSync(`node "${script}" ${port}`, { stdio: "inherit" });
  } catch {
    /* 无占用或已释放 */
  }
}

function createHttpServer(): Server {
  const instance = createServer((req, res) => {
    app.handleRequest(req, res);
  });
  // PDF 导出等长耗时请求：避免 Node 默认超时过早断开连接。
  instance.timeout = 0;
  instance.requestTimeout = 0;
  instance.headersTimeout = 0;
  return instance;
}

let server = createHttpServer();

function listenOnce(target: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    const onError = (err: NodeJS.ErrnoException) => {
      cleanup();
      reject(err);
    };
    const onListening = () => {
      cleanup();
      resolve();
    };
    const cleanup = () => {
      target.off("error", onError);
      target.off("listening", onListening);
    };

    target.once("error", onError);
    target.once("listening", onListening);
    target.listen(port);
  });
}

async function startServer(): Promise<void> {
  const maxAttempts = process.env.NODE_ENV === "production" ? 1 : 8;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await listenOnce(server);
      console.log(
        `LexOS API listening on ${app.env.apiUrl} (NODE_ENV=${app.env.nodeEnv})`,
      );
      return;
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code !== "EADDRINUSE" || attempt >= maxAttempts) {
        if (code === "EADDRINUSE") {
          console.error(
            `Port ${port} is already in use after ${maxAttempts} attempts. Run: npm run dev:api:kill`,
          );
        } else {
          console.error(err);
        }
        process.exit(1);
      }

      console.warn(
        `Port ${port} is in use (attempt ${attempt}/${maxAttempts}); freeing and retrying…`,
      );
      freeListenPortInDev();
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
      server = createHttpServer();
      await sleep(400 * attempt);
    }
  }
}

void startServer();

export { server, app };
