import {
  buildBackupMirrorPlan,
  formatBackupMirrorPlan,
  getBackupMirrorConfigFromEnv,
} from "../src/lib/operations/backup-mirror.ts";

const config = getBackupMirrorConfigFromEnv();
const plan = buildBackupMirrorPlan(config);

console.log(formatBackupMirrorPlan(plan));

if (plan.blockers.length) {
  process.exitCode = 1;
}
