import {
  buildFinalDeploymentAcceptance,
  formatFinalDeploymentAcceptance,
} from "../src/lib/deployment/final-acceptance.ts";

const report = buildFinalDeploymentAcceptance();

console.log(formatFinalDeploymentAcceptance(report));

if (report.blockers.length) {
  process.exitCode = 1;
}
