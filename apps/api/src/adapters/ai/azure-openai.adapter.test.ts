import { describe, expect, it } from "vitest";
import { AzureOpenAiAdapter } from "./azure-openai.adapter.js";

describe("AzureOpenAiAdapter.healthCheck", () => {
  it("fails when baseUrl missing", async () => {
    const adapter = new AzureOpenAiAdapter();
    const result = await adapter.healthCheck({
      providerKind: "azure_openai",
      modelId: "gpt-4",
      modelName: "gpt-4",
      apiKey: "key",
      baseUrl: null,
    });
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe("VALIDATION_FAILED");
  });
});
