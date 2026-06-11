import { existsSync } from "node:fs";
import process from "node:process";

import {
  buildBackupTaskInstallationPlan,
  formatBackupTaskInstallationPlan,
  getBackupTaskInstallationConfigFromEnv,
  parseBackupTaskInstallationPlatform,
} from "../src/lib/operations/backup-task-installation.ts";

if (existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}

const config = getBackupTaskInstallationConfigFromEnv();
const plan = buildBackupTaskInstallationPlan({
  logDir: readValueArg("--log-dir=") || config.logDir,
  owner: readValueArg("--owner=") || config.owner,
  platform: parseBackupTaskInstallationPlatform(readValueArg("--platform=") || config.platform),
  projectRoot: process.cwd(),
  runAsAccount: readValueArg("--run-as=") || config.runAsAccount,
});

console.log(formatBackupTaskInstallationPlan(plan));

if (plan.blockers.length) {
  process.exitCode = 1;
}

function readValueArg(prefix: string): string | undefined {
  const arg = process.argv.find((value) => value.startsWith(prefix));

  return arg?.slice(prefix.length);
}
