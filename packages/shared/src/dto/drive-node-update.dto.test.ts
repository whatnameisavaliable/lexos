import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { parseDriveNodeUpdateBody } from "./drive-node-update.dto.js";

describe("driveNodeUpdateBodySchema", () => {
  it("accepts rename only", () => {
    const body = parseDriveNodeUpdateBody({ name: "新名称" });
    expect(body.name).toBe("新名称");
    expect(body.parentId).toBeUndefined();
  });

  it("accepts move only", () => {
    const body = parseDriveNodeUpdateBody({
      parentId: "00000000-0000-4000-8000-000000000002",
    });
    expect(body.parentId).toBe("00000000-0000-4000-8000-000000000002");
  });

  it("rejects empty patch body", () => {
    expect(() => parseDriveNodeUpdateBody({})).toThrow(ZodError);
  });
});
