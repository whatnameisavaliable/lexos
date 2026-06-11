import {
  buildFinalDeploymentAcceptance,
} from "../src/lib/deployment/final-acceptance.ts";
import {
  buildFinalAcceptanceArchivePlan,
  formatFinalAcceptanceArchivePlan,
  getFinalAcceptanceArchiveConfigFromEnv,
  writeFinalAcceptanceArchive,
} from "../src/lib/deployment/final-acceptance-archive.ts";

const args = process.argv.slice(2);
const envConfig = getFinalAcceptanceArchiveConfigFromEnv();
const outputDir = getArgValue("--output-dir") || envConfig.outputDir;
const write = !args.includes("--no-write");
const report = buildFinalDeploymentAcceptance();
const plan = buildFinalAcceptanceArchivePlan({
  outputDir,
  report,
  write,
});

writeFinalAcceptanceArchive(plan);
console.log(formatFinalAcceptanceArchivePlan(plan));

if (plan.blockers.length) {
  process.exitCode = 1;
}

function getArgValue(name: string): string | undefined {
  const prefix = `${name}=`;
  const match = args.find((arg) => arg.startsWith(prefix));

  return match ? match.slice(prefix.length) : undefined;
}
