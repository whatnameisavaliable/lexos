import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { parseAiModelCreateBody } from "./ai-model-create.dto.js";

describe("aiModelCreateBodySchema", () => {
  it("accepts minimal create payload", () => {
    const body = parseAiModelCreateBody({
      name: "GPT-4o",
      providerKind: "openai_compatible",
      modelName: "gpt-4o",
      modelId: "gpt-4o",
      apiKey: "sk-test-key",
    });

    expect(body.name).toBe("GPT-4o");
    expect(body.providerKind).toBe("openai_compatible");
    expect(body.isEnabled).toBeUndefined();
  });

  it("rejects empty apiKey", () => {
    expect(() =>
      parseAiModelCreateBody({
        name: "x",
        providerKind: "openai_compatible",
        modelName: "m",
        modelId: "m",
        apiKey: "",
      }),
    ).toThrow(ZodError);
  });
});
