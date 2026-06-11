import { existsSync } from "node:fs";
import process from "node:process";

import {
  buildDeploymentChannelReadiness,
  formatDeploymentChannelReadiness,
} from "../src/lib/deployment/deployment-channel.ts";

if (existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}

const readiness = buildDeploymentChannelReadiness({
  env: process.env,
});

console.log(formatDeploymentChannelReadiness(readiness));

if (!readiness.ok) {
  process.exitCode = 1;
}
