import { describe, expect, it } from "vitest";
import { buildOpenAiChatCompletionBody } from "./build-openai-chat-completion-body.js";

describe("buildOpenAiChatCompletionBody", () => {
  it("omits temperature by default", () => {
    const body = buildOpenAiChatCompletionBody(
      [{ role: "user", content: "hi" }],
      { model: "gpt-4" },
    );
    expect(body).not.toHaveProperty("temperature");
  });
});
