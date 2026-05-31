import type { IncomingMessage, ServerResponse } from "node:http";
import { matchRoutePattern } from "../lib/route-match.js";
import type { AiModelsListController } from "../controllers/ai-models-list.controller.js";
import type { AiModelsCreateController } from "../controllers/ai-models-create.controller.js";
import type { AiModelsGetController } from "../controllers/ai-models-get.controller.js";
import type { AiModelsPatchController } from "../controllers/ai-models-patch.controller.js";
import type { AiModelsDeleteController } from "../controllers/ai-models-delete.controller.js";
import type { AiModelsTestController } from "../controllers/ai-models-test.controller.js";
import type { AiMappingsListController } from "../controllers/ai-mappings-list.controller.js";
import type { AiMappingsUpsertController } from "../controllers/ai-mappings-upsert.controller.js";
import type { AiPromptsListController } from "../controllers/ai-prompts-list.controller.js";
import type { AiPromptsCreateController } from "../controllers/ai-prompts-create.controller.js";
import type { AiPromptsGetController } from "../controllers/ai-prompts-get.controller.js";
import type { AiPromptsPatchController } from "../controllers/ai-prompts-patch.controller.js";
import type { AiPromptsPublishController } from "../controllers/ai-prompts-publish.controller.js";
import type { AiPromptsDeleteController } from "../controllers/ai-prompts-delete.controller.js";
import type { AiInvocationLogsListController } from "../controllers/ai-invocation-logs-list.controller.js";

export interface AdminAiRouteHandlers {
  readonly modelsList: AiModelsListController;
  readonly modelsCreate: AiModelsCreateController;
  readonly modelsGet: AiModelsGetController;
  readonly modelsPatch: AiModelsPatchController;
  readonly modelsDelete: AiModelsDeleteController;
  readonly modelsTest: AiModelsTestController;
  readonly mappingsList: AiMappingsListController;
  readonly mappingsUpsert: AiMappingsUpsertController;
  readonly promptsList: AiPromptsListController;
  readonly promptsCreate: AiPromptsCreateController;
  readonly promptsGet: AiPromptsGetController;
  readonly promptsPatch: AiPromptsPatchController;
  readonly promptsPublish: AiPromptsPublishController;
  readonly promptsDelete: AiPromptsDeleteController;
  readonly invocationLogsList: AiInvocationLogsListController;
}

/**
 * 分发 `/api/admin/ai/*` 路由；返回是否已处理。
 */
export async function handleAdminAiRoute(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  handlers: AdminAiRouteHandlers,
): Promise<boolean> {
  const method = req.method ?? "GET";

  if (method === "GET" && path === "/api/admin/ai/models") {
    await handlers.modelsList.handle(req, res);
    return true;
  }
  if (method === "POST" && path === "/api/admin/ai/models") {
    await handlers.modelsCreate.handle(req, res);
    return true;
  }

  const modelTestParams = matchRoutePattern(
    "/api/admin/ai/models/:id/test",
    path,
  );
  if (method === "POST" && modelTestParams) {
    await handlers.modelsTest.handle(req, res, modelTestParams);
    return true;
  }

  const modelParams = matchRoutePattern("/api/admin/ai/models/:id", path);
  if (method === "GET" && modelParams) {
    await handlers.modelsGet.handle(req, res, modelParams);
    return true;
  }
  if (method === "PATCH" && modelParams) {
    await handlers.modelsPatch.handle(req, res, modelParams);
    return true;
  }
  if (method === "DELETE" && modelParams) {
    await handlers.modelsDelete.handle(req, res, modelParams);
    return true;
  }

  if (method === "GET" && path === "/api/admin/ai/mappings") {
    await handlers.mappingsList.handle(req, res);
    return true;
  }

  const mappingParams = matchRoutePattern(
    "/api/admin/ai/mappings/:featureKey",
    path,
  );
  if (method === "PUT" && mappingParams) {
    await handlers.mappingsUpsert.handle(req, res, mappingParams);
    return true;
  }

  if (method === "GET" && path === "/api/admin/ai/prompts") {
    await handlers.promptsList.handle(req, res);
    return true;
  }
  if (method === "POST" && path === "/api/admin/ai/prompts") {
    await handlers.promptsCreate.handle(req, res);
    return true;
  }

  const promptPublishParams = matchRoutePattern(
    "/api/admin/ai/prompts/:id/publish",
    path,
  );
  if (method === "POST" && promptPublishParams) {
    await handlers.promptsPublish.handle(req, res, promptPublishParams);
    return true;
  }

  const promptParams = matchRoutePattern("/api/admin/ai/prompts/:id", path);
  if (method === "GET" && promptParams) {
    await handlers.promptsGet.handle(req, res, promptParams);
    return true;
  }
  if (method === "PATCH" && promptParams) {
    await handlers.promptsPatch.handle(req, res, promptParams);
    return true;
  }
  if (method === "DELETE" && promptParams) {
    await handlers.promptsDelete.handle(req, res, promptParams);
    return true;
  }

  if (method === "GET" && path === "/api/admin/ai/invocation-logs") {
    await handlers.invocationLogsList.handle(req, res);
    return true;
  }

  return false;
}
