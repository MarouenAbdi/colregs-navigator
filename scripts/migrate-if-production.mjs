import { execSync } from "node:child_process";

// Vercel (and Vercel-compatible hosts) run this exact vercel-build script for every
// build, including PR/branch preview builds -- the only signal distinguishing a real
// production deploy from a preview is VERCEL_ENV. Gating here (rather than relying on
// callers to only invoke this script in production) means a preview build can never
// apply a migration to the live database, even by mistake.
if (process.env.VERCEL_ENV === "production") {
  execSync("npx prisma migrate deploy", { stdio: "inherit" });
}
