import { describe, expect, it } from "vitest";
import {
  usesDashScopeFunAsrApi,
} from "./dashscope-fun-asr.client.js";
import type { WorkerAiCredentials } from "./worker-ai-client.port.js";

function creds(
  partial: Partial<WorkerAiCredentials> & Pick<WorkerAiCredentials, "modelName">,
): WorkerAiCredentials {
  return {
    modelId: "m1",
    providerKind: "openai_compatible",
    apiKey: "sk-test",
    baseUrl: null,
    ...partial,
  };
}

describe("usesDashScopeFunAsrApi", () => {
  it("returns true for fun-asr-mtl on DashScope", () => {
    expect(
      usesDashScopeFunAsrApi(
        creds({
          modelName: "fun-asr-mtl",
          baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
        }),
      ),
    ).toBe(true);
  });

  it("returns false for OpenAI whisper", () => {
    expect(
      usesDashScopeFunAsrApi(
        creds({
          modelName: "whisper-1",
          baseUrl: "https://api.openai.com/v1",
        }),
      ),
    ).toBe(false);
  });

  it("returns false for DeepSeek chat on compatible endpoint", () => {
    expect(
      usesDashScopeFunAsrApi(
        creds({
          modelName: "deepseek-v4-flash",
          baseUrl: "https://api.deepseek.com/v1",
        }),
      ),
    ).toBe(false);
  });
});
