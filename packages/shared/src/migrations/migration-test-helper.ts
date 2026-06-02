import fs from "node:fs";
import { resolveMigrationFile } from "./manifest.js";

/**
 * 读取已落盘的迁移 SQL 全文（M10 静态断言用）。
 */
export function readMigrationSql(name: string): string {
  return fs.readFileSync(resolveMigrationFile(name), "utf8");
}
