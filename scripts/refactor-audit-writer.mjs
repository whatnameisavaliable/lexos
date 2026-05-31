import fs from "node:fs";
import path from "node:path";

const root = path.join(process.cwd(), "apps/api/src/services");

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (entry.name.endsWith(".ts") && !entry.name.endsWith(".test.ts")) {
      out.push(p);
    }
  }
  return out;
}

for (const file of walk(root)) {
  let content = fs.readFileSync(file, "utf8");
  if (!content.includes("AuditLogRepository")) continue;

  content = content.replace(
    /import type \{ AuditLogRepository \} from "\.\.\/repositories\/audit-log\.repository\.js";\n/g,
    'import type { AuditWriterService, AuditRequestMeta } from "./audit-writer.service.js";\n',
  );
  content = content.replace(
    /private readonly auditLogRepository: AuditLogRepository,/g,
    "private readonly auditWriterService: AuditWriterService,",
  );

  content = content.replace(
    /await this\.auditLogRepository\.append\(\{([\s\S]*?)\}\);/g,
    (_match, body) => {
      const ipMatch = body.match(/\bip:\s*([^,\n]+),?/);
      const uaMatch = body.match(/\buserAgent:\s*([^,\n]+),?/);
      let inner = body;
      if (ipMatch) inner = inner.replace(/\s*ip:\s*[^,\n]+,?\n?/, "");
      if (uaMatch) inner = inner.replace(/\s*userAgent:\s*[^,\n]+,?\n?/, "");
      inner = inner.trim().replace(/,\s*$/, "");
      const ctxParts = [];
      if (ipMatch) ctxParts.push(`ip: ${ipMatch[1].trim()}`);
      if (uaMatch) ctxParts.push(`userAgent: ${uaMatch[1].trim()}`);
      const ctx = ctxParts.length ? `, { ${ctxParts.join(", ")} }` : "";
      return `await this.auditWriterService.write({${inner}}${ctx});`;
    },
  );

  fs.writeFileSync(file, content);
  console.log("updated", path.relative(process.cwd(), file));
}

for (const file of walk(root)) {
  if (file.endsWith("audit-writer.service.ts")) continue;
  let content = fs.readFileSync(file, "utf8");
  if (!content.includes("auditWriterService")) continue;
  if (!content.includes("AuditLogRepository")) continue;
  content = content.replace(
    /import type \{ AuditLogRepository \} from "\.\.\/repositories\/audit-log\.repository\.js";\r?\n/g,
    'import type { AuditWriterService, AuditRequestMeta } from "./audit-writer.service.js";\n',
  );
  fs.writeFileSync(file, content);
  console.log("fixed-import", path.relative(process.cwd(), file));
}
