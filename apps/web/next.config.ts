import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const webRoot = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(webRoot, "../..");
/** 与 U2 共用仓库根 `.env` / `.env.development`（含 `NEXT_PUBLIC_*`）。 */
loadEnvConfig(repoRoot);

const sharedClientEntry = path.resolve(
  webRoot,
  "../../packages/shared/src/client.ts",
);

const apiUrl = process.env.API_URL?.trim() || "http://localhost:4000";

/**
 * U1 经 Next 将 `/api/*` 反代至 U2（`architecture.md` §5.7；禁止浏览器直连 Supabase 写业务表）。
 */
const storageBucketMedia =
  process.env.NEXT_PUBLIC_STORAGE_BUCKET_MEDIA?.trim() ||
  process.env.STORAGE_BUCKET_MEDIA?.trim() ||
  "media";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: repoRoot,
  transpilePackages: ["@lexos/shared"],
  serverExternalPackages: ["pg"],
  /** PDF 导出等长耗时 API：dev 反代默认 30s 会 ECONNRESET，需放宽。 */
  experimental: {
    proxyTimeout: 180_000,
  },
  env: {
    NEXT_PUBLIC_STORAGE_BUCKET_MEDIA: storageBucketMedia,
    NEXT_PUBLIC_TASK_POLL_INTERVAL_MS:
      process.env.NEXT_PUBLIC_TASK_POLL_INTERVAL_MS?.trim() || "2000",
  },
  webpack: (config) => {
    config.resolve ??= {};
    config.resolve.alias = {
      ...config.resolve.alias,
      "@lexos/shared": sharedClientEntry,
    };
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js"],
    };
    return config;
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
