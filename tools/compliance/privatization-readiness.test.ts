import { describe, expect, it } from "vitest";
import {
  checkCaptchaAllowlist,
  checkProductionRequiredKeys,
  checkRealtimeDefault,
  parseEnvFile,
  runPrivatizationReadinessChecks,
} from "../../scripts/privatization-readiness-check.mjs";

describe("privatization-readiness-check", () => {
  it("requires LOGIN_IP_ALLOWLIST when CAPTCHA_PROVIDER=none", () => {
    const env = parseEnvFile(`
CAPTCHA_PROVIDER=none
LOGIN_IP_ALLOWLIST=
`);
    expect(checkCaptchaAllowlist(env).passed).toBe(false);

    const ok = parseEnvFile(`
CAPTCHA_PROVIDER=none
LOGIN_IP_ALLOWLIST=10.0.0.0/8
`);
    expect(checkCaptchaAllowlist(ok).passed).toBe(true);
  });

  it("requires production template keys without REDIS_URL", () => {
    const missing = parseEnvFile(`FFMPEG_PATH=ffmpeg\n`);
    expect(checkProductionRequiredKeys(missing).passed).toBe(false);

    const ok = parseEnvFile(`
FFMPEG_PATH=/usr/bin/ffmpeg
WORKER_MAX_CONCURRENCY=5
AI_CREDENTIALS_ENCRYPTION_KEY=
`);
    expect(checkProductionRequiredKeys(ok).passed).toBe(true);
  });

  it("rejects REALTIME_ENABLED=true in production template", () => {
    expect(
      checkRealtimeDefault(parseEnvFile("REALTIME_ENABLED=true")).passed,
    ).toBe(false);
    expect(
      checkRealtimeDefault(parseEnvFile("REALTIME_ENABLED=false")).passed,
    ).toBe(true);
  });

  it("passes bundled checks on .env.production.example shape", () => {
    const sample = `
CAPTCHA_PROVIDER=none
LOGIN_IP_ALLOWLIST=10.0.0.0/8
FFMPEG_PATH=/usr/bin/ffmpeg
WORKER_MAX_CONCURRENCY=5
AI_CREDENTIALS_ENCRYPTION_KEY=
REALTIME_ENABLED=false
`;
    const results = runPrivatizationReadinessChecks(sample);
    expect(results.every((r) => r.passed)).toBe(true);
  });
});
