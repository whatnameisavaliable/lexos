import { describe, expect, it } from "vitest";
import {
  assertMigrationsManifest,
  listExpectedM11MigrationNames,
  M11_MIGRATIONS,
} from "./manifest.js";

describe("M11 migration manifest", () => {
  it("matches committed ai_invocation_logs_sop_metadata SQL on disk", () => {
    expect(() => assertMigrationsManifest(M11_MIGRATIONS)).not.toThrow();
  });

  it("listExpectedM11MigrationNames returns one entry", () => {
    const names = listExpectedM11MigrationNames();
    expect(names).toHaveLength(1);
    expect(names[0]).toBe("ai_invocation_logs_sop_metadata");
  });
});
