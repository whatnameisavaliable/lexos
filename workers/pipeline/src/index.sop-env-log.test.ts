import { describe, expect, it, vi, beforeAll } from "vitest";
import {
  loadLexosRuntimeEnvFiles,
  loadWorkerRuntimeEnvFromProcess,
  resolveRepoRoot,
} from "@lexos/shared/config";

describe("pipeline worker SOP env startup log", () => {
  beforeAll(() => {
    loadLexosRuntimeEnvFiles(resolveRepoRoot());
  });

  it("includes SOP concurrency env values", () => {
    const env = loadWorkerRuntimeEnvFromProcess();
    const info = vi.fn();
    const original = console.info;
    console.info = info as never;

    console.info(
      `[pipeline-worker] concurrency=${env.workerMaxConcurrency}, asrRateLimit=${env.asrRateLimitMax}/min, sopPdfMax=${env.sopPdfMaxConcurrent}, sopDeepResearchMax=${env.sopDeepResearchMaxConcurrent}`,
    );

    expect(info).toHaveBeenCalledWith(
      expect.stringContaining(`sopPdfMax=${env.sopPdfMaxConcurrent}`),
    );
    expect(info).toHaveBeenCalledWith(
      expect.stringContaining(
        `sopDeepResearchMax=${env.sopDeepResearchMaxConcurrent}`,
      ),
    );

    console.info = original;
  });
});
