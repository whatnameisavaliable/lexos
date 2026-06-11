import { existsSync } from "node:fs";
import process from "node:process";

import {
  buildFinalDeploymentGate,
  formatFinalDeploymentGate,
} from "../src/lib/deployment/final-gate.ts";

if (existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}

const gate = buildFinalDeploymentGate({
  env: process.env,
});

console.log(formatFinalDeploymentGate(gate));

if (!gate.ok) {
  process.exitCode = 1;
}
