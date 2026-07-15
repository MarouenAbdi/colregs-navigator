import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node", // default; explicit here since Success Criterion 3 depends on it
    include: ["src/**/*.test.ts"],
    globals: false, // explicit describe/it/expect imports — matches CLAUDE.md's "no magic" persona
  },
});
