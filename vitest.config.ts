import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node", // default; explicit here since Success Criterion 3 depends on it
    include: ["src/**/*.test.ts"],
    globals: false, // explicit describe/it/expect imports — matches CLAUDE.md's "no magic" persona
    // Rule 3 (blocking, 03-02): Vitest does not auto-load `.env` the way
    // Next.js's runtime does -- without this, src/server/db tests connect
    // with DATABASE_URL undefined. See vitest.setup.ts.
    setupFiles: ["./vitest.setup.ts"],
  },
});
