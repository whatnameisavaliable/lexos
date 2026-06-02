import { describe, expect, it } from "vitest";
import { renderMustacheTemplate } from "./render-mustache-template.js";

describe("renderMustacheTemplate", () => {
  it("replaces known keys and leaves unknown placeholders", () => {
    const out = renderMustacheTemplate(
      "Hi {{name}}, missing {{unknown}}",
      { name: "Lex" },
    );
    expect(out).toBe("Hi Lex, missing {{unknown}}");
  });
});
