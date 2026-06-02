import { describe, expect, it, vi } from "vitest";
import { ErrorCode } from "@lexos/shared/api";
import { AdminSopVersionPromptsUpsertService } from "./admin-sop-version-prompts-upsert.service.js";

const actor = {
  userId: "admin-id",
  role: "admin" as const,
  username: "admin",
  requiresPasswordChange: false,
};

const step = {
  stepCode: "A",
  name: "Entry",
  executionType: "manual" as const,
  inputSchema: {},
  dependsOn: [] as string[],
  requiresVerification: false,
};

describe("AdminSopVersionPromptsUpsertService", () => {
  it("throws OPERATION_NOT_ALLOWED for published versions", async () => {
    const repository = {
      findTemplateVersionById: vi.fn().mockResolvedValue({
        versionId: "v1",
        templateId: "t1",
        isPublished: true,
        steps: [],
      }),
      replaceDraftSteps: vi.fn(),
    };
    const auditWriterService = { write: vi.fn() };
    const service = new AdminSopVersionPromptsUpsertService(
      repository as never,
      auditWriterService as never,
    );

    await expect(
      service.upsert(actor, "v1", { steps: [step] }),
    ).rejects.toMatchObject({ code: ErrorCode.OPERATION_NOT_ALLOWED });

    expect(repository.replaceDraftSteps).not.toHaveBeenCalled();
  });

  it("replaces steps for draft versions", async () => {
    const repository = {
      findTemplateVersionById: vi.fn().mockResolvedValue({
        versionId: "v1",
        templateId: "t1",
        templateName: "SOP",
        caseType: "civil",
        versionNumber: 0,
        isPublished: false,
        publishedAt: null,
        createdAt: "2026-01-01T00:00:00.000Z",
        steps: [],
      }),
      replaceDraftSteps: vi.fn().mockResolvedValue(undefined),
    };
    const auditWriterService = { write: vi.fn().mockResolvedValue("log-id") };
    const service = new AdminSopVersionPromptsUpsertService(
      repository as never,
      auditWriterService as never,
    );

    const result = await service.upsert(actor, "v1", { steps: [step] });
    expect(result.versionId).toBe("v1");
    expect(repository.replaceDraftSteps).toHaveBeenCalled();
  });
});
