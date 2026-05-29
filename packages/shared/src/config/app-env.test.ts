import { describe, expect, it } from "vitest";
import { parseApiListenPort } from "./app-env.js";

describe("parseApiListenPort", () => {
  it("reads explicit port from API_URL", () => {
    expect(parseApiListenPort("http://localhost:4000")).toBe(4000);
  });

  it("defaults http to port 80", () => {
    expect(parseApiListenPort("http://api.example.com")).toBe(80);
  });
});
