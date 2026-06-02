import { afterEach, describe, expect, it } from "vitest";
import { loadSopWorkerRuntimeEnvFromProcess } from "./sop-worker-runtime-env.js";

describe("loadSopWorkerRuntimeEnvFromProcess", () => {
  const previous = { ...process.env };

  afterEach(() => {
    process.env = { ...previous };
  });

  it("uses defaults when env vars are absent", () => {
    delete process.env.SOP_PDF_MAX_CONCURRENT;
    delete process.env.SOP_DEEP_RESEARCH_MAX_CONCURRENT;
    delete process.env.SOP_DEEP_RESEARCH_TIMEOUT_MS;

    const config = loadSopWorkerRuntimeEnvFromProcess();
    expect(config.sopPdfMaxConcurrent).toBe(1);
    expect(config.sopDeepResearchMaxConcurrent).toBe(2);
    expect(config.sopDeepResearchTimeoutMs).toBe(1_800_000);
  });
});
