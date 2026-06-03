import { describe, expect, it } from "vitest";
import type {
  AdminSopListData,
  AdminSopTemplateDetail,
  AdminSopTemplateVersionDetail,
} from "./admin-sops-api.types.js";

describe("admin-sops-api.types", () => {
  it("constructs list row shape", () => {
    const row: AdminSopListData["items"][number] = {
      templateId: "00000000-0000-4000-8000-000000000001",
      name: "民事一审",
      caseType: "civil",
      createdAt: "2026-01-01T00:00:00.000Z",
      versions: [
        {
          versionId: "00000000-0000-4000-8000-000000000002",
          versionNumber: 1,
          isPublished: false,
          publishedAt: null,
          createdAt: "2026-01-01T00:00:00.000Z",
        },
      ],
    };
    expect(row.versions[0]?.isPublished).toBe(false);
  });

  it("constructs template detail shape", () => {
    const detail: AdminSopTemplateDetail = {
      templateId: "00000000-0000-4000-8000-000000000001",
      name: "模板",
      caseType: "civil",
      createdAt: "2026-01-01T00:00:00.000Z",
      versions: [],
    };
    expect(detail.name).toBe("模板");
  });

  it("constructs version detail shape", () => {
    const version: AdminSopTemplateVersionDetail = {
      versionId: "00000000-0000-4000-8000-000000000002",
      templateId: "00000000-0000-4000-8000-000000000001",
      templateName: "模板",
      caseType: "civil",
      versionNumber: 1,
      isPublished: false,
      publishedAt: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      steps: [],
    };
    expect(version.steps).toEqual([]);
  });
});
