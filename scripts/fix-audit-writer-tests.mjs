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
  let changed = false;

  if (content.includes("auditWriterService") && content.includes("append: vi.fn")) {
    content = content.replace(
      /const auditWriterService = \{ append: vi\.fn/g,
      "const auditWriterService = { write: vi.fn",
    );
    content = content.replace(
      /const audit = \{ append: vi\.fn/g,
      "const audit = { write: vi.fn",
    );
    changed = true;
  }

  if (
    content.includes("auditWriterService.write") &&
    content.includes("toHaveBeenCalledWith(\n      expect.objectContaining")
  ) {
    content = content.replace(
      /expect\(auditWriterService\.write\)\.toHaveBeenCalledWith\(\s*(expect\.objectContaining\([\s\S]*?\))\s*\);/g,
      "expect(auditWriterService.write).toHaveBeenCalledWith($1, expect.any(Object));",
    );
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content);
    console.log("fixed", path.relative(process.cwd(), file));
  }
}
