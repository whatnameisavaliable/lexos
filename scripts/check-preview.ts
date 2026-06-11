import { existsSync } from "node:fs";
import process from "node:process";

import { buildPreviewReadiness, formatPreviewReadiness } from "../src/lib/deployment/preview-readiness.ts";

if (existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}

const readiness = buildPreviewReadiness();

console.log(formatPreviewReadiness(readiness));

if (!readiness.ok) {
  process.exitCode = 1;
}
