import type { IncomingMessage, ServerResponse } from "node:http";
import {
  loadAppRuntimeEnv,
  loadAuthRuntimeEnvFromProcess,
  loadAuthSeedEnvFromProcess,
  loadSupabaseEnvFromProcess,
  type AppRuntimeEnvConfig,
} from "@lexos/shared/config";
import { SupabaseAuthAdapter } from "./adapters/auth/supabase-auth.adapter.js";
import { AuthChangePasswordController } from "./controllers/auth-change-password.controller.js";
import { AuthLoginController } from "./controllers/auth-login.controller.js";
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
import { AuthLogoutService } from "./services/auth-logout.service.js";
import { AuthSessionService } from "./services/auth-session.service.js";
import { ProfileService } from "./services/profile.service.js";
import { HealthController } from "./controllers/health.controller.js";
import { RedisHealthAdapter } from "./adapters/redis-health.adapter.js";
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

  const authMiddleware = new AuthMiddleware(supabaseEnv, profileRepository);
  const requireAdmin = requireRoles("admin");

  const loginController = new AuthLoginController(
    authLoginService,
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

  const healthController = new HealthController(
    new HealthCheckService(
      new PostgresHealthRepository(env.supabaseDbUrl),
      new RedisHealthAdapter(env.redisUrl),
    ),
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
