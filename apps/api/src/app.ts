import type { IncomingMessage, ServerResponse } from "node:http";
import {
  loadAppRuntimeEnv,
  loadAuthRuntimeEnvFromProcess,
  loadSupabaseEnvFromProcess,
  type AppRuntimeEnvConfig,
} from "@lexos/shared/config";
import { createCaptchaAdapter } from "./adapters/auth/create-captcha-adapter.js";
import { SupabaseAuthAdapter } from "./adapters/auth/supabase-auth.adapter.js";
import { AuthChangePasswordController } from "./controllers/auth-change-password.controller.js";
import { AuthLoginController } from "./controllers/auth-login.controller.js";
import { AuthLogoutController } from "./controllers/auth-logout.controller.js";
import { AuthMfaEnrollController } from "./controllers/auth-mfa-enroll.controller.js";
import { AuthMfaStatusController } from "./controllers/auth-mfa-status.controller.js";
import { AuthMfaVerifyController } from "./controllers/auth-mfa-verify.controller.js";
import { AuthSessionController } from "./controllers/auth-session.controller.js";
import { ProfileGetController } from "./controllers/profile-get.controller.js";
import { ProfilePatchController } from "./controllers/profile-patch.controller.js";
import { AuthMiddleware } from "./middleware/auth.middleware.js";
import { withErrorHandler } from "./middleware/error-handler.middleware.js";
import { enforcePasswordChangeGate } from "./middleware/password-change-gate.middleware.js";
import { withRequestId } from "./middleware/request-id.middleware.js";
import { requireRoles } from "./middleware/role-gate.factory.js";
import { AuditLogRepository } from "./repositories/audit-log.repository.js";
import { ProfileAdminRepository } from "./repositories/profile-admin.repository.js";
import { ProfileRepository } from "./repositories/profile.repository.js";
import { handleHealthRoute } from "./routes/health.routes.js";
import { AuthChangePasswordService } from "./services/auth-change-password.service.js";
import { AuthLoginService } from "./services/auth-login.service.js";
import { AuthLogoutService } from "./services/auth-logout.service.js";
import { AuthMfaService } from "./services/auth-mfa.service.js";
import { AuthSessionService } from "./services/auth-session.service.js";
import { ProfileService } from "./services/profile.service.js";
import { HealthController } from "./controllers/health.controller.js";
import { RedisHealthAdapter } from "./adapters/redis-health.adapter.js";
import { PostgresHealthRepository } from "./repositories/postgres-health.repository.js";
import { HealthCheckService } from "./services/health-check.service.js";

/** 已组装的 U2 HTTP 应用上下文。 */
export interface LexosApiApp {
  readonly env: AppRuntimeEnvConfig;
  handleRequest(req: IncomingMessage, res: ServerResponse): void;
}

/**
 * 组装 M1 认证与个人中心路由（`tasks.md` M1-F）。
 */
export function createLexosApiApp(env: AppRuntimeEnvConfig): LexosApiApp {
  const supabaseEnv = loadSupabaseEnvFromProcess();
  const authEnv = loadAuthRuntimeEnvFromProcess();

  const authAdapter = new SupabaseAuthAdapter(supabaseEnv, authEnv);
  const captchaAdapter = createCaptchaAdapter(authEnv);
  const profileRepository = new ProfileRepository(supabaseEnv);
  const profileAdminRepository = new ProfileAdminRepository(supabaseEnv);
  const auditLogRepository = new AuditLogRepository(supabaseEnv);

  const authLoginService = new AuthLoginService(
    authAdapter,
    profileRepository,
    auditLogRepository,
    captchaAdapter,
    authEnv,
  );
  const authLogoutService = new AuthLogoutService(authAdapter, auditLogRepository);
  const authSessionService = new AuthSessionService();
  const authChangePasswordService = new AuthChangePasswordService(
    authAdapter,
    profileAdminRepository,
    auditLogRepository,
  );
  const authMfaService = new AuthMfaService(
    authAdapter,
    profileAdminRepository,
    authEnv,
  );
  const profileService = new ProfileService(profileRepository);

  const authMiddleware = new AuthMiddleware(supabaseEnv, profileRepository);
  const mfaRoleGate = requireRoles("admin", "director");

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
  const mfaEnrollController = new AuthMfaEnrollController(
    authMfaService,
    env.requestIdHeader,
  );
  const mfaVerifyController = new AuthMfaVerifyController(
    authMfaService,
    env.requestIdHeader,
  );
  const mfaStatusController = new AuthMfaStatusController(
    authMfaService,
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

  const healthController = new HealthController(
    new HealthCheckService(
      new PostgresHealthRepository(env.supabaseDbUrl),
      new RedisHealthAdapter(env.redisUrl),
    ),
  );

  const protectedRoute = (
    handler: (req: IncomingMessage, res: ServerResponse) => Promise<void>,
    options?: {
      skipPasswordGate?: boolean;
      roleGate?: (res: ServerResponse) => boolean;
    },
  ) => {
    return async (req: IncomingMessage, res: ServerResponse) => {
      await authMiddleware.requireAuth(req, res, async () => {
        if (options?.roleGate && !options.roleGate(res)) {
          return;
        }
        if (!options?.skipPasswordGate && !enforcePasswordChangeGate(res)) {
          return;
        }
        await handler(req, res);
      });
    };
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
      method: "POST",
      path: "/api/auth/mfa/enroll",
      handler: protectedRoute((req, res) => mfaEnrollController.handle(req, res), {
        roleGate: mfaRoleGate,
      }),
    },
    {
      method: "POST",
      path: "/api/auth/mfa/verify",
      handler: protectedRoute((req, res) => mfaVerifyController.handle(req, res), {
        roleGate: mfaRoleGate,
      }),
    },
    {
      method: "GET",
      path: "/api/auth/mfa/status",
      handler: protectedRoute((req, res) => mfaStatusController.handle(req, res), {
        roleGate: mfaRoleGate,
        skipPasswordGate: true,
      }),
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
