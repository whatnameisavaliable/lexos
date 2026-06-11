import { existsSync } from "node:fs";
import process from "node:process";

import {
  buildPostDeploymentVerification,
  formatPostDeploymentVerification,
} from "../src/lib/deployment/post-deployment-verification.ts";

if (existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}

const report = buildPostDeploymentVerification({
  env: process.env,
});

console.log(formatPostDeploymentVerification(report));

if (!report.ok) {
  process.exitCode = 1;
}
