import { existsSync } from "node:fs";
import process from "node:process";

import {
  buildHandoverEvidenceIndex,
  formatHandoverEvidenceIndex,
} from "../src/lib/deployment/handover-evidence.ts";

if (existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}

const index = buildHandoverEvidenceIndex({
  env: process.env,
});

console.log(formatHandoverEvidenceIndex(index));

if (!index.ok) {
  process.exitCode = 1;
}
