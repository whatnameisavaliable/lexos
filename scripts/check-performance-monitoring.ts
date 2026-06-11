import { existsSync } from "node:fs";

import {
  buildPerformanceMonitoringReadiness,
  formatPerformanceMonitoringReadiness,
} from "../src/lib/operations/performance-monitoring.ts";

if (existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}

const readiness = buildPerformanceMonitoringReadiness({
  env: process.env,
});

console.log(formatPerformanceMonitoringReadiness(readiness));

if (!readiness.ok) {
  process.exitCode = 1;
}
