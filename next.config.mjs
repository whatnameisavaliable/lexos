/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The build script runs typecheck first; avoid duplicate Next worker checks on Windows.
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    webpackBuildWorker: false,
  },
};

export default nextConfig;
