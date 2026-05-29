import { describe, expect, it } from "vitest";
import { maskApiKey } from "./mask-api-key.js";

describe("maskApiKey", () => {
  it("masks standard sk- keys", () => {
    expect(maskApiKey("sk-abcdefghijklmnop")).toBe("sk-***");
  });

  it("returns *** for empty input", () => {
    expect(maskApiKey("")).toBe("***");
  });
});
