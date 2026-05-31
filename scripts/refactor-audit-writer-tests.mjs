import fs from "node:fs";
import path from "node:path";

const root = path.join(process.cwd(), "apps/api/src");

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (entry.name.endsWith(".test.ts")) out.push(p);
  }
  return out;
}

for (const file of walk(root)) {
  let content = fs.readFileSync(file, "utf8");
  if (!content.includes("auditLogRepository")) continue;
  content = content.replace(
    /const auditLogRepository = \{ append: vi\.fn\(\) \};/g,
    "const auditWriterService = { write: vi.fn() };",
  );
  content = content.replace(/auditLogRepository/g, "auditWriterService");
  content = content.replace(/\.append/g, ".write");
  fs.writeFileSync(file, content);
  console.log("updated", path.relative(process.cwd(), file));
}
