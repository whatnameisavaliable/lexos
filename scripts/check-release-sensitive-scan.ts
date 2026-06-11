import {
  buildReleaseSensitiveScanReport,
  formatReleaseSensitiveScanReport,
} from "../src/lib/deployment/release-sensitive-scan.ts";

const report = buildReleaseSensitiveScanReport();

console.log(formatReleaseSensitiveScanReport(report));

if (!report.ok) {
  process.exitCode = 1;
}
