import { describe, expect, it } from "vitest";
import { CustomHttpAdapter } from "./custom-http.adapter.js";

describe("CustomHttpAdapter.healthCheck", () => {
  it("requires baseUrl", async () => {
    const adapter = new CustomHttpAdapter();
    const result = await adapter.healthCheck({
      providerKind: "custom_http",
      modelId: "x",
      modelName: "x",
      apiKey: "",
      baseUrl: null,
    });
    expect(result.success).toBe(false);
  });
});
