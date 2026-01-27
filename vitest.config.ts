import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["config/vitest.setup.ts"],
    include: ["**/*.test.{ts,tsx}"],
    pool: "threads",
    coverage: {
      provider: "v8",
      include: ["**/*.{ts,tsx}"],
    },
  },
});
