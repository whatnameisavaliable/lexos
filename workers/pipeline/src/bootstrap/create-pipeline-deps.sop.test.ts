import { describe, expect, it, beforeAll } from "vitest";
import {
  loadLexosRuntimeEnvFiles,
  loadWorkerRuntimeEnvFromProcess,
  resolveRepoRoot,
} from "@lexos/shared/config";
import {
  REGISTERED_WORKER_STAGE_KEYS,
  createPipelineStageProcessor,
} from "./create-pipeline-deps.js";

describe("createPipelineStageProcessor SOP wiring", () => {
  beforeAll(() => {
    loadLexosRuntimeEnvFiles(resolveRepoRoot());
  });

  it("registers 8 worker stage keys including 3 SOP stages", () => {
    expect(REGISTERED_WORKER_STAGE_KEYS).toHaveLength(8);
    expect(REGISTERED_WORKER_STAGE_KEYS).toContain("sop.media.ocr");
    expect(REGISTERED_WORKER_STAGE_KEYS).toContain("sop.deep_research");
    expect(REGISTERED_WORKER_STAGE_KEYS).toContain("sop.pdf_export");
  });

  it("creates processor with mock pdf renderer", () => {
    const env = loadWorkerRuntimeEnvFromProcess();
    const processor = createPipelineStageProcessor(env, {
      pdfRenderer: {
        renderHtmlToPdfBuffer: async () => Buffer.from("pdf"),
      },
    });
    expect(processor).toBeDefined();
  });
});
