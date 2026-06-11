import { existsSync } from "node:fs";
import process from "node:process";

import {
  buildPrivateDeploymentReadiness,
  formatPrivateDeploymentReadiness,
  readPrivateReadinessInventory,
} from "../src/lib/deployment/private-readiness.ts";

if (existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}

const readiness = buildPrivateDeploymentReadiness(process.env, readPrivateReadinessInventory());

console.log(formatPrivateDeploymentReadiness(readiness));

if (!readiness.ok) {
  process.exitCode = 1;
}
