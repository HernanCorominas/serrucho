import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
      "@serrucho/core": path.resolve(__dirname, "../../packages/core/src/index.ts"),
      "@serrucho/core/": path.resolve(__dirname, "../../packages/core/src/"),
      "@serrucho/supabase": path.resolve(__dirname, "../../packages/supabase/src/index.ts"),
      "@serrucho/ui": path.resolve(__dirname, "../../packages/ui/src/index.ts"),
    },
  },
});
