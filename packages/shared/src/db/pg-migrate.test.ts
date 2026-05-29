import { describe, expect, it } from "vitest";
import {
  listMigrationSqlFiles,
  migrationVersionFromFileName,
} from "./pg-migrate.js";

describe("pg-migrate", () => {
  it("lists migration files in timestamp order", () => {
    const files = listMigrationSqlFiles();
    expect(files.length).toBeGreaterThan(0);
    expect(files[0]).toMatch(/^\d+_.+\.sql$/);
    const sorted = [...files].sort();
    expect(files).toEqual(sorted);
  });

  it("derives version from file name", () => {
    expect(
      migrationVersionFromFileName("20260529102025_extensions_pg_trgm.sql"),
    ).toBe("20260529102025_extensions_pg_trgm");
  });
});
