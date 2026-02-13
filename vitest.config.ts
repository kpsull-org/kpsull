import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.spec.ts"],
    exclude: ["node_modules", ".next"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json", "lcov"],
      exclude: [
        "node_modules",
        "src/**/*.d.ts",
        "src/**/*.test.ts",
        "src/**/*.spec.ts",
        "src/**/index.ts",
        "src/**/__tests__/helpers/**",
        ".next",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
