import { describe, expect, it } from "vitest";
import {
  assertMigrationsManifest,
  listExpectedM10MigrationNames,
  M10_MIGRATIONS,
} from "./manifest.js";

describe("M10 migration manifest", () => {
  it("matches committed SOP SQL files on disk", () => {
    expect(() => assertMigrationsManifest(M10_MIGRATIONS)).not.toThrow();
  });

  it("listExpectedM10MigrationNames returns 11 entries including rls_sop", () => {
    const names = listExpectedM10MigrationNames();
    expect(names).toHaveLength(11);
    expect(names).toContain("rls_sop");
    expect(names[0]).toBe("enums_sop");
    expect(names[10]).toBe("seed_system_settings_sop");
  });
});
