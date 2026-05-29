import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { loadAiRuntimeEnvFromProcess } from "./ai-runtime-env.js";

describe("loadAiRuntimeEnvFromProcess", () => {
  const original = { ...process.env };

  afterEach(() => {
    process.env = { ...original };
  });

  beforeEach(() => {
    process.env.AI_CREDENTIALS_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString(
      "base64",
    );
  });

  it("loads 32-byte encryption key", () => {
    const env = loadAiRuntimeEnvFromProcess();
    expect(env.aiCredentialsEncryptionKey).toHaveLength(32);
    expect(env.aiTestTimeoutMs).toBe(10_000);
  });

  it("throws when key length is invalid", () => {
    process.env.AI_CREDENTIALS_ENCRYPTION_KEY = Buffer.alloc(16, 1).toString(
      "base64",
    );
    expect(() => loadAiRuntimeEnvFromProcess()).toThrow(/32 bytes/);
  });

  it("throws when encryption key env is missing", () => {
    delete process.env.AI_CREDENTIALS_ENCRYPTION_KEY;
    expect(() => loadAiRuntimeEnvFromProcess()).toThrow(
      /AI_CREDENTIALS_ENCRYPTION_KEY/,
    );
  });
});
