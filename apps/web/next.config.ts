import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const webRoot = path.dirname(fileURLToPath(import.meta.url));
const sharedClientEntry = path.resolve(
  webRoot,
  "../../packages/shared/src/client.ts",
);

const apiUrl = process.env.API_URL?.trim() || "http://localhost:4000";

/**
 * U1 经 Next 将 `/api/*` 反代至 U2（`architecture.md` §5.7；禁止浏览器直连 Supabase 写业务表）。
 */
const nextConfig: NextConfig = {
  transpilePackages: ["@lexos/shared"],
  serverExternalPackages: ["pg"],
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
