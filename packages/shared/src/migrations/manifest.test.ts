import { describe, expect, it } from "vitest";
import { assertMigrationsManifest } from "./manifest.js";

describe("M0-B migration manifest", () => {
  it("matches committed SQL files on disk", () => {
    expect(() => assertMigrationsManifest()).not.toThrow();
  });
});
