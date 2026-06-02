import type { IncomingMessage, ServerResponse } from "node:http";
import { matchRoutePattern } from "../lib/route-match.js";
import type { AdminSopsListController } from "../controllers/admin-sops-list.controller.js";
import type { AdminSopsTemplateCreateController } from "../controllers/admin-sops-template-create.controller.js";
import type { AdminSopsTemplateGetController } from "../controllers/admin-sops-template-get.controller.js";
import type { AdminSopsVersionGetController } from "../controllers/admin-sops-version-get.controller.js";
import type { AdminSopsVersionPromptsUpsertController } from "../controllers/admin-sops-version-prompts-upsert.controller.js";
import type { AdminSopsVersionCreateController } from "../controllers/admin-sops-version-create.controller.js";
import type { AdminSopsVersionPublishController } from "../controllers/admin-sops-version-publish.controller.js";
import type { AdminSopsPreviewPipelineController } from "../controllers/admin-sops-preview-pipeline.controller.js";

export interface AdminSopsRouteHandlers {
  readonly list: AdminSopsListController;
  readonly templateCreate: AdminSopsTemplateCreateController;
  readonly templateGet: AdminSopsTemplateGetController;
  readonly versionGet: AdminSopsVersionGetController;
  readonly versionPromptsUpsert: AdminSopsVersionPromptsUpsertController;
  readonly versionCreate: AdminSopsVersionCreateController;
  readonly versionPublish: AdminSopsVersionPublishController;
  readonly previewPipeline: AdminSopsPreviewPipelineController;
}

/**
 * 分发 `/api/admin/sops*` 路由；返回是否已处理。
 */
export async function handleAdminSopsRoute(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  handlers: AdminSopsRouteHandlers,
): Promise<boolean> {
  const method = req.method ?? "GET";

  if (method === "GET" && path === "/api/admin/sops") {
    await handlers.list.handle(req, res);
    return true;
  }

  if (method === "POST" && path === "/api/admin/sops/templates") {
    await handlers.templateCreate.handle(req, res);
    return true;
  }

  if (method === "POST" && path === "/api/admin/sops/preview-pipeline") {
    await handlers.previewPipeline.handle(req, res);
    return true;
  }

  const templateGetParams = matchRoutePattern(
    "/api/admin/sops/templates/:template_id",
    path,
  );
  if (method === "GET" && templateGetParams) {
    await handlers.templateGet.handle(req, res, {
      template_id: templateGetParams.template_id,
    });
    return true;
  }

  const versionCreateParams = matchRoutePattern(
    "/api/admin/sops/templates/:template_id/versions",
    path,
  );
  if (method === "POST" && versionCreateParams) {
    await handlers.versionCreate.handle(req, res, {
      template_id: versionCreateParams.template_id,
    });
    return true;
  }

  const versionGetParams = matchRoutePattern(
    "/api/admin/sops/template-versions/:version_id",
    path,
  );
  if (method === "GET" && versionGetParams) {
    await handlers.versionGet.handle(req, res, {
      version_id: versionGetParams.version_id,
    });
    return true;
  }

  const versionPromptsParams = matchRoutePattern(
    "/api/admin/sops/template-versions/:version_id/prompts",
    path,
  );
  if (method === "PUT" && versionPromptsParams) {
    await handlers.versionPromptsUpsert.handle(req, res, {
      version_id: versionPromptsParams.version_id,
    });
    return true;
  }

  const versionPublishParams = matchRoutePattern(
    "/api/admin/sops/template-versions/:version_id/publish",
    path,
  );
  if (method === "POST" && versionPublishParams) {
    await handlers.versionPublish.handle(req, res, {
      version_id: versionPublishParams.version_id,
    });
    return true;
  }

  return false;
}
