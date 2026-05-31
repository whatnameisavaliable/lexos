import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["packages/**/*.test.ts", "apps/**/*.test.ts", "workers/**/*.test.ts", "workers/**/__tests__/**/*.test.ts", "tools/compliance/**/*.test.ts"],
    testTimeout: 30_000,
  },
  resolve: {
    alias: {
      "@lexos/shared": path.resolve(__dirname, "packages/shared/src"),
      "@lexos/shared/api": path.resolve(__dirname, "packages/shared/src/api"),
      "@lexos/shared/config": path.resolve(
        __dirname,
        "packages/shared/src/config",
      ),
    },
  },
});
