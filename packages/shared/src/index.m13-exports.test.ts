import { describe, expect, it } from "vitest";
import {
  parseSopPipelineCreateBody,
  parseSopStepExecuteBody,
  parseSopArtifactPatchBody,
  parseSopUploadInitBody,
  parseSopUploadCompleteBody,
  sopPipelineCreateBodySchema,
  sopStepExecuteBodySchema,
  sopArtifactPatchBodySchema,
  sopUploadInitBodySchema,
  sopUploadCompleteBodySchema,
} from "./index.js";
import type {
  SopPublishedTemplateItem,
  SopPipelineStatusResponse,
  SopAsyncExecuteAccepted,
} from "./index.js";

describe("M13-A package exports", () => {
  it("re-exports M13 SOP DTO parsers and schemas from package entry", () => {
    expect(sopPipelineCreateBodySchema).toBeDefined();
    expect(sopStepExecuteBodySchema).toBeDefined();
    expect(sopArtifactPatchBodySchema).toBeDefined();
    expect(sopUploadInitBodySchema).toBeDefined();
    expect(sopUploadCompleteBodySchema).toBeDefined();
    expect(
      parseSopPipelineCreateBody({
        templateVersionId: "00000000-0000-4000-8000-000000000001",
      }).templateVersionId,
    ).toBe("00000000-0000-4000-8000-000000000001");
    expect(parseSopStepExecuteBody({}).formValues).toEqual({});
    expect(parseSopArtifactPatchBody({ contentRaw: "" }).contentRaw).toBe("");
    expect(
      parseSopUploadCompleteBody({
        uploadSessionId: "00000000-0000-4000-8000-000000000099",
      }).uploadSessionId,
    ).toBe("00000000-0000-4000-8000-000000000099");
    expect(
      parseSopUploadInitBody({
        pipelineId: "00000000-0000-4000-8000-000000000010",
        fileName: "a.mp3",
        mimeType: "audio/mpeg",
        sizeBytes: 1,
      }).fileName,
    ).toBe("a.mp3");
  });

  it("re-exports M13 SOP response types", () => {
    const template: SopPublishedTemplateItem = {
      templateVersionId: "v",
      templateName: "n",
      caseType: "c",
      versionNumber: 1,
    };
    const status: SopPipelineStatusResponse = {
      pipelineId: "p",
      status: "in_progress",
      currentStepCode: null,
      deepResearchEnabled: true,
      steps: [],
    };
    const accepted: SopAsyncExecuteAccepted = {
      pipelineId: "p",
      stepCode: "s",
      artifactId: "a",
    };
    expect(template.versionNumber).toBe(1);
    expect(status.steps).toEqual([]);
    expect(accepted.artifactId).toBe("a");
  });
});
