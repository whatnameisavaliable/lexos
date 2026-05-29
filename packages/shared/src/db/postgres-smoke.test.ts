import { describe, expect, it, vi } from "vitest";
import { probePostgresSelectOne } from "./postgres-smoke.js";

vi.mock("pg", () => {
  const query = vi.fn().mockResolvedValue({ rows: [{ one: 1 }] });
  const end = vi.fn().mockResolvedValue(undefined);
  class Pool {
    query = query;
    end = end;
  }
  return { default: { Pool } };
});

describe("probePostgresSelectOne (mocked)", () => {
  it("returns ok when SELECT 1 succeeds", async () => {
    const result = await probePostgresSelectOne(
      "postgresql://localhost:5432/postgres",
    );
    expect(result.ok).toBe(true);
  });
});
