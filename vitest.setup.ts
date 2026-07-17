// Rule 3 (blocking): Vitest, unlike Next.js's runtime and unlike the `prisma`
// CLI (which loads `.env` via prisma.config.ts's own `dotenv/config` import),
// does not auto-load `.env` into `process.env`. Without this, every test
// touching `src/server/db/client.ts`'s `prisma` singleton would connect with
// `DATABASE_URL` undefined, failing at the driver-adapter layer before any
// query runs. This setup file is the single place that loads `.env` for the
// whole Vitest run (referenced via `vitest.config.ts`'s `setupFiles`).
import "dotenv/config";
