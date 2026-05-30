import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { parseDriveFolderCreateBody } from "./drive-folder-create.dto.js";

describe("driveFolderCreateBodySchema", () => {
  it("accepts valid parentId and name", () => {
    const body = parseDriveFolderCreateBody({
      parentId: "00000000-0000-4000-8000-000000000001",
      name: " 合同资料 ",
    });
    expect(body.parentId).toBe("00000000-0000-4000-8000-000000000001");
    expect(body.name).toBe("合同资料");
  });

  it("rejects empty name", () => {
    expect(() =>
      parseDriveFolderCreateBody({
        parentId: "00000000-0000-4000-8000-000000000001",
        name: "   ",
      }),
    ).toThrow(ZodError);
  });

  it("rejects non-uuid parentId", () => {
    expect(() =>
      parseDriveFolderCreateBody({
        parentId: "not-a-uuid",
        name: "folder",
      }),
    ).toThrow(ZodError);
  });

  it("rejects unknown keys", () => {
    expect(() =>
      parseDriveFolderCreateBody({
        parentId: "00000000-0000-4000-8000-000000000001",
        name: "folder",
        nodeType: "file",
      } as Record<string, unknown>),
    ).toThrow(ZodError);
  });
});
