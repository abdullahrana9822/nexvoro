import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    globals: false,
    reporters: ["default"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // `server-only` is a Next bundler marker; tests run outside it.
      "server-only": fileURLToPath(new URL("./scripts/shims/server-only.ts", import.meta.url)),
    },
  },
});
