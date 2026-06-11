import { existsSync } from "node:fs";
import process from "node:process";

import {
  buildVercelPreviewDeploymentEvidence,
  formatVercelPreviewDeploymentEvidence,
} from "../src/lib/deployment/preview-deployment-evidence.ts";

if (existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}

const report = buildVercelPreviewDeploymentEvidence({
  env: process.env,
});

console.log(formatVercelPreviewDeploymentEvidence(report));

if (!report.ok) {
  process.exitCode = 1;
}
