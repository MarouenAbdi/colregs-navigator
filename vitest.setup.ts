// Rule 3 (blocking): Vitest, unlike Next.js's runtime and unlike the `prisma`
// CLI (which loads `.env` via prisma.config.ts's own `dotenv/config` import),
// does not auto-load `.env` into `process.env`. Without this, every test
// touching `src/server/db/client.ts`'s `prisma` singleton would connect with
// `DATABASE_URL` undefined, failing at the driver-adapter layer before any
// query runs. This setup file is the single place that loads `.env` for the
// whole Vitest run (referenced via `vitest.config.ts`'s `setupFiles`).
import "dotenv/config";
import "@testing-library/jest-dom/vitest";

// Rule 3 (blocking, 04-01): @testing-library/jest-dom@6.9.1's own
// `vitest.d.ts` augments `declare module "vitest" { interface Assertion }`,
// but vitest@4.1.10's `vitest` package re-exports (rather than directly
// declares) `Assertion` from `@vitest/expect` -- TypeScript's declaration
// merging does not follow that re-export, so jest-dom's matchers (e.g.
// `toBeInTheDocument`) never actually land on the `expect(...)` return type
// under `tsc --noEmit`, even though they work correctly at runtime.
// Augmenting `@vitest/expect` directly (the module that truly declares
// `Assertion`) fixes the static types without changing runtime behavior.
import type { TestingLibraryMatchers } from "@testing-library/jest-dom/matchers";

declare module "@vitest/expect" {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- must match @vitest/expect's own `Assertion<T = any>` default exactly (TS2428)
  interface Assertion<T = any>
    extends TestingLibraryMatchers<unknown, T> {}
}
