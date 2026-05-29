import { describe, expect, it } from "vitest";
import {
  createAiCredentialCrypto,
  decryptAiCredential,
  encryptAiCredential,
} from "./ai-credential-crypto.js";
import { loadAiRuntimeEnvFromProcess } from "@lexos/shared/config";

describe("ai-credential-crypto", () => {
  const key = Buffer.alloc(32, 9);

  it("round-trips plaintext", () => {
    const cipher = encryptAiCredential("sk-secret-key", key);
    expect(decryptAiCredential(cipher, key)).toBe("sk-secret-key");
    expect(cipher).not.toContain("sk-secret");
  });

  it("createAiCredentialCrypto uses env key", () => {
    process.env.AI_CREDENTIALS_ENCRYPTION_KEY = key.toString("base64");
    const env = loadAiRuntimeEnvFromProcess();
    const crypto = createAiCredentialCrypto(env);
    const encrypted = crypto.encrypt("token");
    expect(crypto.decrypt(encrypted)).toBe("token");
  });

  it("fails decrypt on tampered payload", () => {
    const cipher = encryptAiCredential("x", key);
    expect(() => decryptAiCredential(cipher.slice(0, -2) + "xx", key)).toThrow();
  });
});
