import { existsSync } from "node:fs";
import process from "node:process";

import {
  buildReleasePackageCheck,
  formatReleasePackageCheck,
  readReleasePackageInventory,
} from "../src/lib/deployment/release-package.ts";

if (existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}

const check = buildReleasePackageCheck({
  env: process.env,
  inventory: readReleasePackageInventory(),
});

console.log(formatReleasePackageCheck(check));

if (!check.ok) {
  process.exitCode = 1;
}
