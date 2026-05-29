import { afterEach, describe, expect, it } from "vitest";
import { loadAsrRuntimeEnvFromProcess } from "./asr-runtime-env.js";

describe("loadAsrRuntimeEnvFromProcess", () => {
  const previous = { ...process.env };

  afterEach(() => {
    process.env = { ...previous };
  });

  it("defaults express max duration to 1800", () => {
    delete process.env.ASR_EXPRESS_MAX_DURATION_SEC;
    expect(loadAsrRuntimeEnvFromProcess().asrExpressMaxDurationSec).toBe(1800);
  });

  it("reads ASR_EXPRESS_MAX_DURATION_SEC from env", () => {
    process.env.ASR_EXPRESS_MAX_DURATION_SEC = "900";
    expect(loadAsrRuntimeEnvFromProcess().asrExpressMaxDurationSec).toBe(900);
  });
});
