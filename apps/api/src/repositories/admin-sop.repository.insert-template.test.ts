import { describe, expect, it, vi } from "vitest";
import { AdminSopRepository } from "./admin-sop.repository.js";

describe("AdminSopRepository.insertTemplateWithInitialDraft", () => {
  it("inserts template and draft version", async () => {
    const templateRow = {
      id: "t1",
      name: "SOP",
      case_type: "civil",
      created_by: "admin",
      created_at: "2026-01-01T00:00:00.000Z",
    };
    const versionRow = {
      id: "v1",
      template_id: "t1",
      version_number: 0,
      is_published: false,
      published_at: null,
      created_by: "admin",
      created_at: "2026-01-01T00:00:00.000Z",
    };

    const from = vi.fn((table: string) => {
      if (table === "sop_templates") {
        return {
          insert: () => ({
            select: () => ({
              single: async () => ({ data: templateRow, error: null }),
            }),
          }),
        };
      }
      if (table === "sop_template_versions") {
        return {
          insert: () => ({
            select: () => ({
              single: async () => ({ data: versionRow, error: null }),
            }),
          }),
        };
      }
      return {};
    });

    const repo = new AdminSopRepository({ from } as never);
    const result = await repo.insertTemplateWithInitialDraft("admin", {
      name: "SOP",
      caseType: "civil",
    });

    expect(result).toEqual({ templateId: "t1", versionId: "v1" });
  });
});
