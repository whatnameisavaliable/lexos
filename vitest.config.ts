import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["packages/**/*.test.ts", "apps/**/*.test.ts", "workers/**/*.test.ts"],
    testTimeout: 30_000,
  },
  resolve: {
    alias: {
      "@lexos/shared": path.resolve(__dirname, "packages/shared/src"),
    },
  },
});
