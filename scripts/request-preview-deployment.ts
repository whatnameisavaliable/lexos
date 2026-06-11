import { existsSync } from "node:fs";
import process from "node:process";

import {
  buildVercelPreviewDeploymentRequest,
  formatVercelPreviewDeploymentRequest,
} from "../src/lib/deployment/preview-deployment-request.ts";

if (existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}

const request = buildVercelPreviewDeploymentRequest();

console.log(formatVercelPreviewDeploymentRequest(request));

if (!request.ok) {
  process.exitCode = 1;
}
