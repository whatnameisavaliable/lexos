import {
  buildBackupAlertPlan,
  formatBackupAlertPlan,
  getBackupAlertConfigFromEnv,
} from "../src/lib/operations/backup-alerts.ts";

const config = getBackupAlertConfigFromEnv();
const plan = buildBackupAlertPlan(config);

console.log(formatBackupAlertPlan(plan));

if (plan.blockers.length) {
  process.exitCode = 1;
}
