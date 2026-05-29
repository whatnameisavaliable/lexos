import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import type { AiRuntimeEnvConfig } from "@lexos/shared/config";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

/**
 * 使用 AES-256-GCM 加密 API Key，输出 base64 载荷（`iv:tag:ciphertext` 拼接）。
 */
export function encryptAiCredential(
  plaintext: string,
  key: Buffer,
): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

/**
 * 解密 {@link encryptAiCredential} 生成的密文。
 */
export function decryptAiCredential(ciphertext: string, key: Buffer): string {
  const payload = Buffer.from(ciphertext, "base64");
  if (payload.length < IV_LENGTH + AUTH_TAG_LENGTH + 1) {
    throw new Error("Invalid AI credential ciphertext");
  }
  const iv = payload.subarray(0, IV_LENGTH);
  const tag = payload.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const data = payload.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString(
    "utf8",
  );
}

/**
 * 从运行时配置构造加解密闭包（避免业务层直接持有原始密钥引用）。
 */
export function createAiCredentialCrypto(env: AiRuntimeEnvConfig): {
  readonly encrypt: (plaintext: string) => string;
  readonly decrypt: (ciphertext: string) => string;
} {
  const key = env.aiCredentialsEncryptionKey;
  return {
    encrypt: (plaintext: string) => encryptAiCredential(plaintext, key),
    decrypt: (ciphertext: string) => decryptAiCredential(ciphertext, key),
  };
}
