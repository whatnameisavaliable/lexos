import { describe, expect, it } from "vitest";
import {
  assertUsableWorkerDatabaseUrl,
  describeDatabaseEndpoint,
  isPlaceholderDatabaseUrl,
} from "./worker-database-url.js";

describe("worker-database-url", () => {
  it("detects placeholder URLs", () => {
    expect(
      isPlaceholderDatabaseUrl(
        "postgresql://postgres:your-password@db.your-project-ref.supabase.co:5432/postgres",
      ),
    ).toBe(true);
  });

  it("describes endpoint without password", () => {
    expect(
      describeDatabaseEndpoint(
        "postgresql://postgres.x:secret@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres",
      ),
    ).toBe("aws-1-ap-northeast-1.pooler.supabase.com:5432 (session-pooler)");
  });

  it("throws on placeholder", () => {
    expect(() =>
      assertUsableWorkerDatabaseUrl(
        "postgresql://postgres:your-password@db.ref.supabase.co:6543/postgres",
      ),
    ).toThrow(/placeholder/i);
  });
});
