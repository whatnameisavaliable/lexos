import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  loadEnvFiles,
  loadWorkerRuntimeEnvFromProcess,
  resolveRepoRoot,
} from "@lexos/shared/config";
import { createPipelineStageProcessor } from "../src/bootstrap/create-pipeline-deps.js";
import { createWorkerDbPool } from "../src/infra/worker-db-pool.js";
import { OutboxPollerService } from "../src/services/outbox-poller.service.js";

function resolvePipelineRepoRoot() {
  const fromModule = resolveRepoRoot(
    path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", ".."),
  );
  if (fs.existsSync(path.join(fromModule, ".env.development"))) {
    return fromModule;
  }
  return resolveRepoRoot();
}

const repoRoot = resolvePipelineRepoRoot();
loadEnvFiles(repoRoot, [".env", ".env.development"]);
const env = loadWorkerRuntimeEnvFromProcess();
const dbPool = createWorkerDbPool(env);
const stageProcessor = createPipelineStageProcessor(env);
const poller = new OutboxPollerService(env, dbPool.getPool(), stageProcessor);

const count = await poller.pollOnce();
console.log(`pollOnce processed=${count}`);
await poller.stop();
await dbPool.end();
