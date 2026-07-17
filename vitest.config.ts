import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node", // default; explicit here since Success Criterion 3 depends on it
    include: ["src/**/*.test.{ts,tsx}"],
    globals: false, // explicit describe/it/expect imports — matches CLAUDE.md's "no magic" persona
    // Rule 3 (blocking, 03-02): Vitest does not auto-load `.env` the way
    // Next.js's runtime does -- without this, src/server/db tests connect
    // with DATABASE_URL undefined. See vitest.setup.ts.
    setupFiles: ["./vitest.setup.ts"],
    // Rule 3 (blocking, 03-02): scenario-repository.test.ts and
    // scenario-service.test.ts both exercise the same live Postgres
    // `Scenario` table with no per-file schema isolation (a single shared
    // Docker instance, D-01). Running test files in parallel let one file's
    // `isCurated` row leak into the other file's "listGallery returns []"
    // assertion (each file's own afterAll cleanup runs too late relative to
    // the other file's concurrently-running assertions). Sequential file
    // execution keeps each file's create -> assert -> afterAll cleanup
    // cycle fully isolated from the others.
    fileParallelism: false,
  },
});
