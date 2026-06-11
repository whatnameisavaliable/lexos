import {
  buildTenantIsolationReadiness,
  formatTenantIsolationReadiness,
  readTenantIsolationInventory,
} from "../src/lib/operations/tenant-isolation.ts";

const readiness = buildTenantIsolationReadiness({
  inventory: readTenantIsolationInventory(),
});

console.log(formatTenantIsolationReadiness(readiness));

if (!readiness.ok) {
  process.exitCode = 1;
}
