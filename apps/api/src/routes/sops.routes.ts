import type { IncomingMessage, ServerResponse } from "node:http";
import { matchRoutePattern } from "../lib/route-match.js";
import type { SopTemplatesListController } from "../controllers/sop-templates-list.controller.js";
import type { SopUploadsInitController } from "../controllers/sop-uploads-init.controller.js";
import type { SopUploadsCompleteController } from "../controllers/sop-uploads-complete.controller.js";
import type { SopPipelinesCreateController } from "../controllers/sop-pipelines-create.controller.js";
import type { SopPipelinesStatusController } from "../controllers/sop-pipelines-status.controller.js";
import type { SopPipelinesResumeController } from "../controllers/sop-pipelines-resume.controller.js";
import type { SopPipelinesCloseController } from "../controllers/sop-pipelines-close.controller.js";
import type { SopStepExecuteController } from "../controllers/sop-step-execute.controller.js";
import type { SopStepFinalizeController } from "../controllers/sop-step-finalize.controller.js";
import type { SopArtifactGetController } from "../controllers/sop-artifact-get.controller.js";
import type { SopArtifactPatchController } from "../controllers/sop-artifact-patch.controller.js";
import type { SopArtifactVerifyController } from "../controllers/sop-artifact-verify.controller.js";
import type { SopArtifactRegeneratePdfController } from "../controllers/sop-artifact-regenerate-pdf.controller.js";

export interface SopsRouteHandlers {
  readonly templatesList: SopTemplatesListController;
  readonly uploadsInit: SopUploadsInitController;
  readonly uploadsComplete: SopUploadsCompleteController;
  readonly pipelinesCreate: SopPipelinesCreateController;
  readonly pipelinesStatus: SopPipelinesStatusController;
  readonly pipelinesResume: SopPipelinesResumeController;
  readonly pipelinesClose: SopPipelinesCloseController;
  readonly stepExecute: SopStepExecuteController;
  readonly stepFinalize: SopStepFinalizeController;
  readonly artifactGet: SopArtifactGetController;
  readonly artifactPatch: SopArtifactPatchController;
  readonly artifactVerify: SopArtifactVerifyController;
  readonly artifactRegeneratePdf: SopArtifactRegeneratePdfController;
}

/**
 * 分发 `/api/sops/*`（律师端 SOP 流水线业务 API · M13）。
 */
export async function handleSopsRoute(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  handlers: SopsRouteHandlers,
): Promise<boolean> {
  const method = req.method ?? "GET";

  if (method === "GET" && path === "/api/sops/templates") {
    await handlers.templatesList.handle(req, res);
    return true;
  }

  if (method === "POST" && path === "/api/sops/uploads/init") {
    await handlers.uploadsInit.handle(req, res);
    return true;
  }

  if (method === "POST" && path === "/api/sops/uploads/complete") {
    await handlers.uploadsComplete.handle(req, res);
    return true;
  }

  if (method === "POST" && path === "/api/sops/pipelines") {
    await handlers.pipelinesCreate.handle(req, res);
    return true;
  }

  const statusMatch = matchRoutePattern("/api/sops/pipelines/:id/status", path);
  if (method === "GET" && statusMatch) {
    await handlers.pipelinesStatus.handle(req, res, { id: statusMatch.id });
    return true;
  }

  const resumeMatch = matchRoutePattern("/api/sops/pipelines/:id/resume", path);
  if (method === "POST" && resumeMatch) {
    await handlers.pipelinesResume.handle(req, res, { id: resumeMatch.id });
    return true;
  }

  const closeMatch = matchRoutePattern("/api/sops/pipelines/:id/close", path);
  if (method === "POST" && closeMatch) {
    await handlers.pipelinesClose.handle(req, res, { id: closeMatch.id });
    return true;
  }

  const executeMatch = matchRoutePattern(
    "/api/sops/pipelines/:id/steps/:code/execute",
    path,
  );
  if (method === "POST" && executeMatch) {
    await handlers.stepExecute.handle(req, res, {
      id: executeMatch.id,
      code: executeMatch.code,
    });
    return true;
  }

  const finalizeMatch = matchRoutePattern(
    "/api/sops/pipelines/:id/steps/:code/finalize",
    path,
  );
  if (method === "POST" && finalizeMatch) {
    await handlers.stepFinalize.handle(req, res, {
      id: finalizeMatch.id,
      code: finalizeMatch.code,
    });
    return true;
  }

  const artifactMatch = matchRoutePattern("/api/sops/artifacts/:id", path);
  if (artifactMatch) {
    if (method === "GET") {
      await handlers.artifactGet.handle(req, res, { id: artifactMatch.id });
      return true;
    }
    if (method === "PATCH") {
      await handlers.artifactPatch.handle(req, res, { id: artifactMatch.id });
      return true;
    }
  }

  const verifyMatch = matchRoutePattern("/api/sops/artifacts/:id/verify", path);
  if (method === "POST" && verifyMatch) {
    await handlers.artifactVerify.handle(req, res, { id: verifyMatch.id });
    return true;
  }

  const regenerateMatch = matchRoutePattern(
    "/api/sops/artifacts/:id/regenerate-pdf",
    path,
  );
  if (method === "POST" && regenerateMatch) {
    await handlers.artifactRegeneratePdf.handle(req, res, { id: regenerateMatch.id });
    return true;
  }

  return false;
}
