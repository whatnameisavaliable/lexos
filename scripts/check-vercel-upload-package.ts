import {
  buildVercelUploadPackageCheck,
  formatVercelUploadPackageCheck,
} from "../src/lib/deployment/vercel-upload-package.ts";

const check = buildVercelUploadPackageCheck();

console.log(formatVercelUploadPackageCheck(check));

if (!check.ok) {
  process.exitCode = 1;
}
