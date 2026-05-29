import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { parseAiModelUpdateBody } from "./ai-model-update.dto.js";

describe("aiModelUpdateBodySchema", () => {
  it("treats empty apiKey as omit rotation", () => {
    const body = parseAiModelUpdateBody({
      name: "Renamed",
      apiKey: "",
    });

    expect(body.name).toBe("Renamed");
    expect(body.apiKey).toBeUndefined();
  });

  it("rejects empty patch body", () => {
    expect(() => parseAiModelUpdateBody({})).toThrow(ZodError);
  });
});
