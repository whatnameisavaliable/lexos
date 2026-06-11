import { existsSync } from "node:fs";

import {
  buildOperationsLogReadiness,
  formatOperationsLogReadiness,
} from "../src/lib/operations/operations-log.ts";

if (existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}

const readiness = buildOperationsLogReadiness({
  env: process.env,
});

console.log(formatOperationsLogReadiness(readiness));

if (!readiness.ok) {
  process.exitCode = 1;
}
