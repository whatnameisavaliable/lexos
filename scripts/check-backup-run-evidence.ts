import { existsSync } from "node:fs";
import process from "node:process";

import {
  buildBackupRunEvidenceCheck,
  formatBackupRunEvidenceCheck,
  getBackupRunEvidenceConfigFromEnv,
} from "../src/lib/operations/backup-run-evidence.ts";

if (existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}

const config = getBackupRunEvidenceConfigFromEnv();
const check = buildBackupRunEvidenceCheck({
  lastSuccessAt: readValueArg("--last-success-at=") || config.lastSuccessAt,
  logRef: readValueArg("--log-ref=") || config.logRef,
  maxAgeHours: parseNumberArg("--max-age-hours=") ?? config.maxAgeHours,
  owner: readValueArg("--owner=") || config.owner,
  rehearsalRef: readValueArg("--rehearsal-ref=") || config.rehearsalRef,
  taskExportRef: readValueArg("--task-export-ref=") || config.taskExportRef,
});

console.log(formatBackupRunEvidenceCheck(check));

if (check.blockers.length) {
  process.exitCode = 1;
}

function readValueArg(prefix: string): string | undefined {
  const arg = process.argv.find((value) => value.startsWith(prefix));

  return arg?.slice(prefix.length);
}

function parseNumberArg(prefix: string): number | undefined {
  const value = readValueArg(prefix);

  if (!value) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);

  return Number.isFinite(parsed) ? parsed : undefined;
}
