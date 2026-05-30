import type { IncomingMessage, ServerResponse } from "node:http";
import {
  loadAiRuntimeEnvFromProcess,
  loadAppRuntimeEnv,
  loadAuthRuntimeEnvFromProcess,
  loadAuthSeedEnvFromProcess,
  loadSupabaseEnvFromProcess,
  type AppRuntimeEnvConfig,
} from "@lexos/shared/config";
import { AiAdapterFactory } from "./adapters/ai/ai-adapter.factory.js";
import { SupabaseAuthAdapter } from "./adapters/auth/supabase-auth.adapter.js";
import { AuthChangePasswordController } from "./controllers/auth-change-password.controller.js";
import { AuthLoginController } from "./controllers/auth-login.controller.js";
import { AuthRefreshController } from "./controllers/auth-refresh.controller.js";
import { AuthLogoutController } from "./controllers/auth-logout.controller.js";
import { AuthSessionController } from "./controllers/auth-session.controller.js";
import { ProfileGetController } from "./controllers/profile-get.controller.js";
import { ProfilePatchController } from "./controllers/profile-patch.controller.js";
import { AuthMiddleware } from "./middleware/auth.middleware.js";
import { withErrorHandler } from "./middleware/error-handler.middleware.js";
import { enforcePasswordChangeGate } from "./middleware/password-change-gate.middleware.js";
import { requireRoles } from "./middleware/role-gate.factory.js";
import { withRequestId } from "./middleware/request-id.middleware.js";
import { AdminUserRepository } from "./repositories/admin-user.repository.js";
import { AuditLogRepository } from "./repositories/audit-log.repository.js";
import { ProfileAdminRepository } from "./repositories/profile-admin.repository.js";
import { ProfileRepository } from "./repositories/profile.repository.js";
import { handleHealthRoute } from "./routes/health.routes.js";
import { AuthChangePasswordService } from "./services/auth-change-password.service.js";
import { AuthLoginService } from "./services/auth-login.service.js";
import { AuthRefreshService } from "./services/auth-refresh.service.js";
import { AuthLogoutService } from "./services/auth-logout.service.js";
import { AuthSessionService } from "./services/auth-session.service.js";
import { ProfileService } from "./services/profile.service.js";
import { HealthController } from "./controllers/health.controller.js";
import { PostgresHealthRepository } from "./repositories/postgres-health.repository.js";
import { HealthCheckService } from "./services/health-check.service.js";
import { AdminUserListService } from "./services/admin-user-list.service.js";
import { AdminUserCreateService } from "./services/admin-user-create.service.js";
import { AdminUserGetService } from "./services/admin-user-get.service.js";
import { AdminUserUpdateService } from "./services/admin-user-update.service.js";
import { AdminUserStatusService } from "./services/admin-user-status.service.js";
import { AdminUserResetPasswordService } from "./services/admin-user-reset-password.service.js";
import { AdminUsersListController } from "./controllers/admin-users-list.controller.js";
import { AdminUsersCreateController } from "./controllers/admin-users-create.controller.js";
import { AdminUsersGetController } from "./controllers/admin-users-get.controller.js";
import { AdminUsersPatchController } from "./controllers/admin-users-patch.controller.js";
import { AdminUsersStatusController } from "./controllers/admin-users-status.controller.js";
import { AdminUsersResetPasswordController } from "./controllers/admin-users-reset-password.controller.js";
import { handleAdminUsersRoute } from "./routes/admin-users.routes.js";
import { handleAdminAiRoute } from "./routes/admin-ai.routes.js";
import { AiModelRepository } from "./repositories/ai-model.repository.js";
import { AiFeatureMappingRepository } from "./repositories/ai-feature-mapping.repository.js";
import { AiPromptRepository } from "./repositories/ai-prompt.repository.js";
import { AiInvocationLogRepository } from "./repositories/ai-invocation-log.repository.js";
import { AiModelListService } from "./services/ai-model-list.service.js";
import { AiModelCreateService } from "./services/ai-model-create.service.js";
import { AiModelUpdateService } from "./services/ai-model-update.service.js";
import { AiModelDeleteService } from "./services/ai-model-delete.service.js";
import { AiModelGetService } from "./services/ai-model-get.service.js";
import { AiModelHealthcheckService } from "./services/ai-model-healthcheck.service.js";
import { AiFeatureMappingListService } from "./services/ai-feature-mapping-list.service.js";
import { AiFeatureMappingUpsertService } from "./services/ai-feature-mapping-upsert.service.js";
import { AiPromptListService } from "./services/ai-prompt-list.service.js";
import { AiPromptCreateService } from "./services/ai-prompt-create.service.js";
import { AiPromptGetService } from "./services/ai-prompt-get.service.js";
import { AiPromptUpdateService } from "./services/ai-prompt-update.service.js";
import { AiPromptPublishService } from "./services/ai-prompt-publish.service.js";
import { AiPromptDeleteService } from "./services/ai-prompt-delete.service.js";
import { AiInvocationLogListService } from "./services/ai-invocation-log-list.service.js";
import { AiModelsListController } from "./controllers/ai-models-list.controller.js";
import { AiModelsCreateController } from "./controllers/ai-models-create.controller.js";
import { AiModelsGetController } from "./controllers/ai-models-get.controller.js";
import { AiModelsPatchController } from "./controllers/ai-models-patch.controller.js";
import { AiModelsDeleteController } from "./controllers/ai-models-delete.controller.js";
import { AiModelsTestController } from "./controllers/ai-models-test.controller.js";
import { AiMappingsListController } from "./controllers/ai-mappings-list.controller.js";
import { AiMappingsUpsertController } from "./controllers/ai-mappings-upsert.controller.js";
import { AiPromptsListController } from "./controllers/ai-prompts-list.controller.js";
import { AiPromptsCreateController } from "./controllers/ai-prompts-create.controller.js";
import { AiPromptsGetController } from "./controllers/ai-prompts-get.controller.js";
import { AiPromptsPatchController } from "./controllers/ai-prompts-patch.controller.js";
import { AiPromptsPublishController } from "./controllers/ai-prompts-publish.controller.js";
import { AiPromptsDeleteController } from "./controllers/ai-prompts-delete.controller.js";
import { AiInvocationLogsListController } from "./controllers/ai-invocation-logs-list.controller.js";
import { SupabaseStorageAdapter } from "./adapters/storage/supabase-storage.adapter.js";
import { DocxExportAdapter } from "./adapters/export/docx-export.adapter.js";
import { PdfExportAdapter } from "./adapters/export/pdf-export.adapter.js";
import { TxtExportAdapter } from "./adapters/export/txt-export.adapter.js";
import { TranscriptionTaskRepository } from "./repositories/transcription-task.repository.js";
import { TranscriptionTranscriptRepository } from "./repositories/transcription-transcript.repository.js";
import { TranscriptionTaskWriteRepository } from "./repositories/transcription-task-write.repository.js";
import { UploadSessionRepository } from "./repositories/upload-session.repository.js";
import { OutboxRepository } from "./repositories/outbox.repository.js";
import { TaskStateRepository } from "./repositories/task-state.repository.js";
import { TranscriptionUploadInitService } from "./services/transcription-upload-init.service.js";
import { TranscriptionUploadCompleteService } from "./services/transcription-upload-complete.service.js";
import { TranscriptionTaskListService } from "./services/transcription-task-list.service.js";
import { TranscriptionTaskGetService } from "./services/transcription-task-get.service.js";
import { TranscriptionTranscriptGetService } from "./services/transcription-transcript-get.service.js";
import { TranscriptionTranscriptPatchService } from "./services/transcription-transcript-patch.service.js";
import { TranscriptionTaskDownloadService } from "./services/transcription-task-download.service.js";
import { TranscriptionExportDocxService } from "./services/transcription-export-docx.service.js";
import { TranscriptionExportPdfService } from "./services/transcription-export-pdf.service.js";
import { TranscriptionExportTxtService } from "./services/transcription-export-txt.service.js";
import { TranscriptionTaskDeleteService } from "./services/transcription-task-delete.service.js";
import { TranscriptionUploadsInitController } from "./controllers/transcription-uploads-init.controller.js";
import { TranscriptionUploadsCompleteController } from "./controllers/transcription-uploads-complete.controller.js";
import { TranscriptionTasksListController } from "./controllers/transcription-tasks-list.controller.js";
import { TranscriptionTasksGetController } from "./controllers/transcription-tasks-get.controller.js";
import { TranscriptionTranscriptGetController } from "./controllers/transcription-transcript-get.controller.js";
import { TranscriptionTranscriptPatchController } from "./controllers/transcription-transcript-patch.controller.js";
import { TranscriptionTaskDownloadController } from "./controllers/transcription-task-download.controller.js";
import { TranscriptionTaskExportDocxController } from "./controllers/transcription-task-export-docx.controller.js";
import { TranscriptionTaskExportPdfController } from "./controllers/transcription-task-export-pdf.controller.js";
import { TranscriptionTaskExportTxtController } from "./controllers/transcription-task-export-txt.controller.js";
import { TranscriptionTaskDeleteController } from "./controllers/transcription-task-delete.controller.js";
import { handleTranscriptionUploadsRoute } from "./routes/transcription-uploads.routes.js";
import { handleTranscriptionTasksRoute } from "./routes/transcription-tasks.routes.js";
import { loadStorageRuntimeEnvFromProcess } from "@lexos/shared/config";

/** 已组装的 U2 HTTP 应用上下文。 */
export interface LexosApiApp {
  readonly env: AppRuntimeEnvConfig;
  handleRequest(req: IncomingMessage, res: ServerResponse): void;
}

/**
 * 组装 M1 认证与个人中心路由（首期不含验证码 / MFA 路由）。
 */
export function createLexosApiApp(env: AppRuntimeEnvConfig): LexosApiApp {
  const supabaseEnv = loadSupabaseEnvFromProcess();
  const authEnv = loadAuthRuntimeEnvFromProcess();
  const authSeedEnv = loadAuthSeedEnvFromProcess();
  const aiEnv = loadAiRuntimeEnvFromProcess();

  const authAdapter = new SupabaseAuthAdapter(supabaseEnv, authEnv);
  const profileRepository = new ProfileRepository(supabaseEnv);
  const profileAdminRepository = new ProfileAdminRepository(supabaseEnv);
  const adminUserRepository = AdminUserRepository.fromSupabaseEnv(supabaseEnv);
  const auditLogRepository = new AuditLogRepository(supabaseEnv);

  const authLoginService = new AuthLoginService(
    authAdapter,
    profileRepository,
    auditLogRepository,
  );
  const authLogoutService = new AuthLogoutService(authAdapter, auditLogRepository);
  const authRefreshService = new AuthRefreshService(
    authAdapter,
    profileRepository,
  );
  const authSessionService = new AuthSessionService();
  const authChangePasswordService = new AuthChangePasswordService(
    authAdapter,
    profileAdminRepository,
    auditLogRepository,
  );
  const profileService = new ProfileService(profileRepository);
  const adminUserListService = new AdminUserListService(adminUserRepository);
  const adminUserCreateService = new AdminUserCreateService(
    authAdapter,
    adminUserRepository,
    auditLogRepository,
    authSeedEnv.authInitialPassword,
  );
  const adminUserGetService = new AdminUserGetService(adminUserRepository);
  const adminUserUpdateService = new AdminUserUpdateService(
    adminUserRepository,
    auditLogRepository,
  );
  const adminUserStatusService = new AdminUserStatusService(
    authAdapter,
    adminUserRepository,
    auditLogRepository,
  );
  const adminUserResetPasswordService = new AdminUserResetPasswordService(
    authAdapter,
    adminUserRepository,
    authSeedEnv.authInitialPassword,
  );

  const aiModelRepository = AiModelRepository.fromSupabaseEnv(supabaseEnv);
  const aiFeatureMappingRepository =
    AiFeatureMappingRepository.fromSupabaseEnv(supabaseEnv);
  const aiPromptRepository = AiPromptRepository.fromSupabaseEnv(supabaseEnv);
  const aiInvocationLogRepository =
    AiInvocationLogRepository.fromSupabaseEnv(supabaseEnv);
  const aiAdapterFactory = new AiAdapterFactory();

  const aiModelListService = new AiModelListService(aiModelRepository, aiEnv);
  const aiModelCreateService = new AiModelCreateService(
    aiModelRepository,
    auditLogRepository,
    aiEnv,
  );
  const aiModelUpdateService = new AiModelUpdateService(
    aiModelRepository,
    auditLogRepository,
    aiEnv,
  );
  const aiModelDeleteService = new AiModelDeleteService(aiModelRepository);
  const aiModelGetService = new AiModelGetService(aiModelRepository, aiEnv);
  const aiModelHealthcheckService = new AiModelHealthcheckService(
    aiModelRepository,
    aiAdapterFactory,
    aiEnv.aiTestTimeoutMs,
    aiEnv,
  );
  const aiFeatureMappingListService = new AiFeatureMappingListService(
    aiFeatureMappingRepository,
  );
  const aiFeatureMappingUpsertService = new AiFeatureMappingUpsertService(
    aiFeatureMappingRepository,
    auditLogRepository,
  );
  const aiPromptListService = new AiPromptListService(aiPromptRepository);
  const aiPromptCreateService = new AiPromptCreateService(aiPromptRepository);
  const aiPromptGetService = new AiPromptGetService(aiPromptRepository);
  const aiPromptUpdateService = new AiPromptUpdateService(aiPromptRepository);
  const aiPromptPublishService = new AiPromptPublishService(
    aiPromptRepository,
    auditLogRepository,
  );
  const aiPromptDeleteService = new AiPromptDeleteService(aiPromptRepository);
  const aiInvocationLogListService = new AiInvocationLogListService(
    aiInvocationLogRepository,
  );

  const storageEnv = loadStorageRuntimeEnvFromProcess();
  const storageAdapter = new SupabaseStorageAdapter(supabaseEnv, storageEnv);
  const transcriptionTaskRepository = new TranscriptionTaskRepository(supabaseEnv);
  const transcriptionTranscriptRepository = new TranscriptionTranscriptRepository(
    supabaseEnv,
  );
  const transcriptionTaskWriteRepository =
    new TranscriptionTaskWriteRepository();
  const uploadSessionRepository = new UploadSessionRepository(supabaseEnv);
  const outboxRepository = new OutboxRepository();
  const taskStateRepository = new TaskStateRepository();
  const transcriptionUploadInitService = new TranscriptionUploadInitService(
    transcriptionTaskRepository,
    uploadSessionRepository,
    storageAdapter,
    auditLogRepository,
    storageEnv.storageBucketMedia,
  );
  const transcriptionUploadCompleteService =
    new TranscriptionUploadCompleteService(
      supabaseEnv,
      transcriptionTaskRepository,
      transcriptionTaskWriteRepository,
      uploadSessionRepository,
      storageAdapter,
      taskStateRepository,
      outboxRepository,
    );
  const transcriptionTaskListService = new TranscriptionTaskListService(
    transcriptionTaskRepository,
  );
  const transcriptionTaskGetService = new TranscriptionTaskGetService(
    transcriptionTaskRepository,
  );
  const transcriptionTranscriptGetService = new TranscriptionTranscriptGetService(
    transcriptionTaskRepository,
    transcriptionTranscriptRepository,
  );
  const transcriptionTranscriptPatchService =
    new TranscriptionTranscriptPatchService(
      transcriptionTaskRepository,
      transcriptionTranscriptRepository,
    );
  const transcriptionTaskDownloadService = new TranscriptionTaskDownloadService(
    transcriptionTaskRepository,
    storageAdapter,
    auditLogRepository,
  );
  const docxExportAdapter = new DocxExportAdapter();
  const pdfExportAdapter = new PdfExportAdapter();
  const txtExportAdapter = new TxtExportAdapter();
  const transcriptionExportDocxService = new TranscriptionExportDocxService(
    transcriptionTaskRepository,
    transcriptionTranscriptRepository,
    docxExportAdapter,
    storageAdapter,
    auditLogRepository,
  );
  const transcriptionExportPdfService = new TranscriptionExportPdfService(
    transcriptionTaskRepository,
    transcriptionTranscriptRepository,
    pdfExportAdapter,
    storageAdapter,
    auditLogRepository,
  );
  const transcriptionExportTxtService = new TranscriptionExportTxtService(
    transcriptionTaskRepository,
    transcriptionTranscriptRepository,
    txtExportAdapter,
    storageAdapter,
    auditLogRepository,
  );
  const transcriptionTaskDeleteService = new TranscriptionTaskDeleteService(
    transcriptionTaskRepository,
    auditLogRepository,
  );

  const authMiddleware = new AuthMiddleware(supabaseEnv, profileRepository);
  const requireAdmin = requireRoles("admin");
  const requireTranscriptionAccess = requireRoles("admin", "lawyer");

  const loginController = new AuthLoginController(
    authLoginService,
    env.requestIdHeader,
  );
  const refreshController = new AuthRefreshController(
    authRefreshService,
    env.requestIdHeader,
  );
  const logoutController = new AuthLogoutController(
    authLogoutService,
    env.requestIdHeader,
  );
  const sessionController = new AuthSessionController(
    authSessionService,
    env.requestIdHeader,
  );
  const changePasswordController = new AuthChangePasswordController(
    authChangePasswordService,
    env.requestIdHeader,
  );
  const profileGetController = new ProfileGetController(
    profileService,
    env.requestIdHeader,
  );
  const profilePatchController = new ProfilePatchController(
    profileService,
    env.requestIdHeader,
  );
  const adminUsersListController = new AdminUsersListController(
    adminUserListService,
    env.requestIdHeader,
  );
  const adminUsersCreateController = new AdminUsersCreateController(
    adminUserCreateService,
    env.requestIdHeader,
  );
  const adminUsersGetController = new AdminUsersGetController(
    adminUserGetService,
    env.requestIdHeader,
  );
  const adminUsersPatchController = new AdminUsersPatchController(
    adminUserUpdateService,
    env.requestIdHeader,
  );
  const adminUsersStatusController = new AdminUsersStatusController(
    adminUserStatusService,
    env.requestIdHeader,
  );
  const adminUsersResetPasswordController = new AdminUsersResetPasswordController(
    adminUserResetPasswordService,
    env.requestIdHeader,
  );
  const aiModelsListController = new AiModelsListController(
    aiModelListService,
    env.requestIdHeader,
  );
  const aiModelsCreateController = new AiModelsCreateController(
    aiModelCreateService,
    env.requestIdHeader,
  );
  const aiModelsGetController = new AiModelsGetController(
    aiModelGetService,
    env.requestIdHeader,
  );
  const aiModelsPatchController = new AiModelsPatchController(
    aiModelUpdateService,
    env.requestIdHeader,
  );
  const aiModelsDeleteController = new AiModelsDeleteController(
    aiModelDeleteService,
    env.requestIdHeader,
  );
  const aiModelsTestController = new AiModelsTestController(
    aiModelHealthcheckService,
    env.requestIdHeader,
  );
  const aiMappingsListController = new AiMappingsListController(
    aiFeatureMappingListService,
    env.requestIdHeader,
  );
  const aiMappingsUpsertController = new AiMappingsUpsertController(
    aiFeatureMappingUpsertService,
    env.requestIdHeader,
  );
  const aiPromptsListController = new AiPromptsListController(
    aiPromptListService,
    env.requestIdHeader,
  );
  const aiPromptsCreateController = new AiPromptsCreateController(
    aiPromptCreateService,
    env.requestIdHeader,
  );
  const aiPromptsGetController = new AiPromptsGetController(
    aiPromptGetService,
    env.requestIdHeader,
  );
  const aiPromptsPatchController = new AiPromptsPatchController(
    aiPromptUpdateService,
    env.requestIdHeader,
  );
  const aiPromptsPublishController = new AiPromptsPublishController(
    aiPromptPublishService,
    env.requestIdHeader,
  );
  const aiPromptsDeleteController = new AiPromptsDeleteController(
    aiPromptDeleteService,
    env.requestIdHeader,
  );
  const aiInvocationLogsListController = new AiInvocationLogsListController(
    aiInvocationLogListService,
    env.requestIdHeader,
  );
  const transcriptionUploadsInitController =
    new TranscriptionUploadsInitController(
      transcriptionUploadInitService,
      env.requestIdHeader,
    );
  const transcriptionUploadsCompleteController =
    new TranscriptionUploadsCompleteController(
      transcriptionUploadCompleteService,
      env.requestIdHeader,
    );
  const transcriptionTasksListController = new TranscriptionTasksListController(
    transcriptionTaskListService,
    env.requestIdHeader,
  );
  const transcriptionTasksGetController = new TranscriptionTasksGetController(
    transcriptionTaskGetService,
    env.requestIdHeader,
  );
  const transcriptionTranscriptGetController =
    new TranscriptionTranscriptGetController(
      transcriptionTranscriptGetService,
      env.requestIdHeader,
    );
  const transcriptionTranscriptPatchController =
    new TranscriptionTranscriptPatchController(
      transcriptionTranscriptPatchService,
      env.requestIdHeader,
    );
  const transcriptionTaskDownloadController =
    new TranscriptionTaskDownloadController(
      transcriptionTaskDownloadService,
      env.requestIdHeader,
    );
  const transcriptionTaskExportDocxController =
    new TranscriptionTaskExportDocxController(
      transcriptionExportDocxService,
      env.requestIdHeader,
    );
  const transcriptionTaskExportPdfController =
    new TranscriptionTaskExportPdfController(
      transcriptionExportPdfService,
      env.requestIdHeader,
    );
  const transcriptionTaskExportTxtController =
    new TranscriptionTaskExportTxtController(
      transcriptionExportTxtService,
      env.requestIdHeader,
    );
  const transcriptionTaskDeleteController = new TranscriptionTaskDeleteController(
    transcriptionTaskDeleteService,
    env.requestIdHeader,
  );

  const healthController = new HealthController(
    new HealthCheckService(new PostgresHealthRepository(env.supabaseDbUrl)),
  );

  const protectedRoute = (
    handler: (req: IncomingMessage, res: ServerResponse) => Promise<void>,
    options?: { skipPasswordGate?: boolean },
  ) => {
    return async (req: IncomingMessage, res: ServerResponse) => {
      await authMiddleware.requireAuth(req, res, async () => {
        if (!options?.skipPasswordGate && !enforcePasswordChangeGate(res)) {
          return;
        }
        await handler(req, res);
      });
    };
  };

  const protectedAdminRoute = (
    handler: (req: IncomingMessage, res: ServerResponse) => Promise<void>,
  ) => {
    return protectedRoute(async (req, res) => {
      if (!requireAdmin(res)) {
        return;
      }
      await handler(req, res);
    });
  };

  const protectedTranscriptionRoute = (
    handler: (req: IncomingMessage, res: ServerResponse) => Promise<void>,
  ) => {
    return protectedRoute(async (req, res) => {
      if (!requireTranscriptionAccess(res)) {
        return;
      }
      await handler(req, res);
    });
  };

  const routes: Array<{
    method: string;
    path: string;
    handler: (req: IncomingMessage, res: ServerResponse) => void | Promise<void>;
  }> = [
    {
      method: "POST",
      path: "/api/auth/login",
      handler: (req, res) => loginController.handle(req, res),
    },
    {
      method: "POST",
      path: "/api/auth/refresh",
      handler: (req, res) => refreshController.handle(req, res),
    },
    {
      method: "POST",
      path: "/api/auth/logout",
      handler: protectedRoute((req, res) => logoutController.handle(req, res), {
        skipPasswordGate: true,
      }),
    },
    {
      method: "GET",
      path: "/api/auth/session",
      handler: protectedRoute((req, res) => sessionController.handle(req, res), {
        skipPasswordGate: true,
      }),
    },
    {
      method: "POST",
      path: "/api/auth/change-password",
      handler: protectedRoute(
        (req, res) => changePasswordController.handle(req, res),
        { skipPasswordGate: true },
      ),
    },
    {
      method: "GET",
      path: "/api/profile",
      handler: protectedRoute((req, res) => profileGetController.handle(req, res)),
    },
    {
      method: "PATCH",
      path: "/api/profile",
      handler: protectedRoute((req, res) =>
        profilePatchController.handle(req, res),
      ),
    },
  ];

  const handleRequest = (req: IncomingMessage, res: ServerResponse): void => {
    withRequestId(req, env.requestIdHeader, () => {
      void withErrorHandler(res, async () => {
        if (handleHealthRoute(req, res, healthController, env.requestIdHeader)) {
          return;
        }

        const path = req.url?.split("?")[0] ?? "/";

        if (path.startsWith("/api/admin/users")) {
          let handled = false;
          await protectedAdminRoute(async (adminReq, adminRes) => {
            handled = await handleAdminUsersRoute(adminReq, adminRes, path, {
              list: adminUsersListController,
              create: adminUsersCreateController,
              get: adminUsersGetController,
              patch: adminUsersPatchController,
              status: adminUsersStatusController,
              resetPassword: adminUsersResetPasswordController,
            });
            if (!handled) {
              adminRes.statusCode = 404;
              adminRes.setHeader("content-type", "application/json; charset=utf-8");
              adminRes.end(
                JSON.stringify({
                  success: false,
                  error: { code: "RESOURCE_NOT_FOUND" },
                }),
              );
            }
          })(req, res);
          return;
        }

        if (path.startsWith("/api/transcription")) {
          let handled = false;
          await protectedTranscriptionRoute(async (txReq, txRes) => {
            if (path.startsWith("/api/transcription/uploads")) {
              handled = await handleTranscriptionUploadsRoute(
                txReq,
                txRes,
                path,
                {
                  init: transcriptionUploadsInitController,
                  complete: transcriptionUploadsCompleteController,
                },
              );
            } else if (path.startsWith("/api/transcription/tasks")) {
              handled = await handleTranscriptionTasksRoute(
                txReq,
                txRes,
                path,
                {
                  list: transcriptionTasksListController,
                  get: transcriptionTasksGetController,
                  getTranscript: transcriptionTranscriptGetController,
                  patchTranscript: transcriptionTranscriptPatchController,
                  download: transcriptionTaskDownloadController,
                  exportDocx: transcriptionTaskExportDocxController,
                  exportPdf: transcriptionTaskExportPdfController,
                  exportTxt: transcriptionTaskExportTxtController,
                  delete: transcriptionTaskDeleteController,
                },
              );
            }
            if (!handled) {
              txRes.statusCode = 404;
              txRes.setHeader("content-type", "application/json; charset=utf-8");
              txRes.end(
                JSON.stringify({
                  success: false,
                  error: { code: "RESOURCE_NOT_FOUND" },
                }),
              );
            }
          })(req, res);
          return;
        }

        if (path.startsWith("/api/admin/ai")) {
          let handled = false;
          await protectedAdminRoute(async (adminReq, adminRes) => {
            handled = await handleAdminAiRoute(adminReq, adminRes, path, {
              modelsList: aiModelsListController,
              modelsCreate: aiModelsCreateController,
              modelsGet: aiModelsGetController,
              modelsPatch: aiModelsPatchController,
              modelsDelete: aiModelsDeleteController,
              modelsTest: aiModelsTestController,
              mappingsList: aiMappingsListController,
              mappingsUpsert: aiMappingsUpsertController,
              promptsList: aiPromptsListController,
              promptsCreate: aiPromptsCreateController,
              promptsGet: aiPromptsGetController,
              promptsPatch: aiPromptsPatchController,
              promptsPublish: aiPromptsPublishController,
              promptsDelete: aiPromptsDeleteController,
              invocationLogsList: aiInvocationLogsListController,
            });
            if (!handled) {
              adminRes.statusCode = 404;
              adminRes.setHeader("content-type", "application/json; charset=utf-8");
              adminRes.end(
                JSON.stringify({
                  success: false,
                  error: { code: "RESOURCE_NOT_FOUND" },
                }),
              );
            }
          })(req, res);
          return;
        }

        const route = routes.find(
          (r) => r.method === req.method && r.path === path,
        );

        if (!route) {
          res.statusCode = 404;
          res.setHeader("content-type", "application/json; charset=utf-8");
          res.end(
            JSON.stringify({
              success: false,
              error: { code: "RESOURCE_NOT_FOUND" },
            }),
          );
          return;
        }

        await route.handler(req, res);
      });
    });
  };

  return { env, handleRequest };
}

/** 从仓库根目录环境文件创建应用。 */
export function createLexosApiAppFromEnv(
  repoRoot?: string,
): LexosApiApp {
  const env = loadAppRuntimeEnv(repoRoot);
  return createLexosApiApp(env);
}
