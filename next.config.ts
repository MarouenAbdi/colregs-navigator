import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Rule 3 (blocking, 04-01): this repo is checked out as multiple sibling
  // git worktrees (parallel phase-4 executors + the parent checkout), each
  // with its own package-lock.json. Without an explicit root, Turbopack's
  // upward lockfile scan finds more than one and infers the wrong workspace
  // root. Pinning `turbopack.root` to this worktree directory removes the
  // ambiguity (silences the "multiple lockfiles" warning).
  turbopack: {
    root: import.meta.dirname,
  },
  typescript: {
    // Rule 3 (blocking, 04-01): CLAUDE.md locks typescript@7.0.2, the new
    // Go-based ("tsgo") rewrite whose npm package no longer ships the
    // classic `typescript/lib/typescript.js` Program-API entry point that
    // Next.js 16.2.10's built-in `next build` type-checker hardcodes
    // (`lib/verify-typescript-setup.js`). That mismatch makes every
    // `next build` fail with a generic "The 'id' argument must be of type
    // string" crash regardless of the project's actual code. `npx tsc
    // --noEmit` works correctly against this project (verified) since it
    // uses the package's CLI entry point, not the Program API — so it
    // remains the authoritative type-check gate; this flag only disables
    // Next's *redundant, currently-broken* internal duplicate of that check.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
