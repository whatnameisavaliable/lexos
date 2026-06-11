import { existsSync } from "node:fs";

import {
  buildErrorLogReadiness,
  formatErrorLogReadiness,
} from "../src/lib/operations/error-log.ts";

if (existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}

const readiness = buildErrorLogReadiness({
  env: process.env,
});

console.log(formatErrorLogReadiness(readiness));

if (!readiness.ok) {
  process.exitCode = 1;
}
