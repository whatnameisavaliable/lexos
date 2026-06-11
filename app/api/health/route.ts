import { ok } from "@/lib/api/http";
import { buildPreviewReadiness } from "@/lib/deployment/preview-readiness";

export const dynamic = "force-dynamic";

export async function GET() {
  const readiness = buildPreviewReadiness();

  return ok({
    ...readiness,
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local",
    timestamp: new Date().toISOString(),
    vercelEnv: process.env.VERCEL_ENV ?? "local",
  });
}
