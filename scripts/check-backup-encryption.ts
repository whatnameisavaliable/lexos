import {
  buildBackupEncryptionPlan,
  formatBackupEncryptionPlan,
  getBackupEncryptionConfigFromEnv,
} from "../src/lib/operations/backup-encryption.ts";

const config = getBackupEncryptionConfigFromEnv();
const plan = buildBackupEncryptionPlan(config);

console.log(formatBackupEncryptionPlan(plan));

if (plan.blockers.length) {
  process.exitCode = 1;
}
