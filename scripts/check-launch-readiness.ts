import { existsSync } from "node:fs";

import {
  buildLaunchReadinessRunbook,
  formatLaunchReadinessMarkdown,
} from "../src/lib/deployment/launch-readiness.ts";
import { readPrivateReadinessInventory } from "../src/lib/deployment/private-readiness.ts";

if (existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}

const runbook = buildLaunchReadinessRunbook({
  env: process.env,
  inventory: readPrivateReadinessInventory(),
});

console.log(formatLaunchReadinessMarkdown(runbook));

if (!runbook.ok) {
  process.exitCode = 1;
}
