import { existsSync } from "node:fs";

import {
  buildUpgradeReadinessPlan,
  formatUpgradeReadinessMarkdown,
} from "../src/lib/deployment/upgrade-readiness.ts";
import { readPrivateReadinessInventory } from "../src/lib/deployment/private-readiness.ts";

if (existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}

const plan = buildUpgradeReadinessPlan({
  env: process.env,
  inventory: readPrivateReadinessInventory(),
});

console.log(formatUpgradeReadinessMarkdown(plan));

if (!plan.ok) {
  process.exitCode = 1;
}
