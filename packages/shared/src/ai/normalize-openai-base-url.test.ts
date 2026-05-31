import { describe, expect, it } from "vitest";
import {
  isGeminiOpenAiCompatibleBaseUrl,
  normalizeOpenAiCompatibleBaseUrl,
} from "./normalize-openai-base-url.js";

describe("normalizeOpenAiCompatibleBaseUrl", () => {
  it("appends /v1 for bare host", () => {
    expect(normalizeOpenAiCompatibleBaseUrl("https://api.deepseek.com")).toBe(
      "https://api.deepseek.com/v1",
    );
  });

  it("preserves existing /v1 suffix", () => {
    expect(
      normalizeOpenAiCompatibleBaseUrl(
        "https://dashscope.aliyuncs.com/compatible-mode/v1",
      ),
    ).toBe("https://dashscope.aliyuncs.com/compatible-mode/v1");
  });

  it("preserves Gemini OpenAI compat path without extra /v1", () => {
    expect(
      normalizeOpenAiCompatibleBaseUrl(
        "https://generativelanguage.googleapis.com/v1beta/openai/",
      ),
    ).toBe("https://generativelanguage.googleapis.com/v1beta/openai");
  });
});

describe("isGeminiOpenAiCompatibleBaseUrl", () => {
  it("detects generativelanguage host", () => {
    expect(
      isGeminiOpenAiCompatibleBaseUrl(
        "https://generativelanguage.googleapis.com/v1beta/openai",
      ),
    ).toBe(true);
  });
});
