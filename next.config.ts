import path from "node:path";

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
  // Rule 3 (blocking, 05-05): every relative import across src/ and app/
  // (established Phase 1, ~98 imports across 37 files) writes an explicit
  // ".js" specifier pointing at a sibling ".ts"/".tsx" source file — the
  // standard TypeScript NodeNext/bundler convention, and how tsc and Vitest
  // both already resolve these. Neither Turbopack nor Next's default webpack
  // config remaps ".js" onto ".ts"/".tsx" automatically (Turbopack's docs
  // explicitly list `extensionAlias` as an unsupported config option; a
  // vanilla `next dev --webpack` run reproduces the identical "Module not
  // found" failure), so `next dev`/`next build` fail on the very first
  // cross-file import without this. Webpack (unlike Turbopack) does support
  // `resolve.extensionAlias`, so the `dev`/`build` scripts run with
  // `--webpack` and this remaps ".js" specifiers to try ".ts"/".tsx" first —
  // zero changes needed to any of the 37 files using the convention.
  webpack: (config) => {
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js"],
    };
    // Rule 3 (blocking, 06-01): tsconfig.json's "@/*" path alias (added for
    // shadcn) resolves correctly for `tsc`/Vitest, but Next.js's webpack
    // build ("Module not found: Can't resolve '@/lib/utils'") needs the
    // "baseUrl" compilerOption present to auto-derive its own webpack
    // alias -- and typescript@7.0.2 (tsgo) has removed "baseUrl" entirely
    // (hard error: "Option 'baseUrl' has been removed"). Since both tools'
    // requirements can't be satisfied by tsconfig.json alone, mirror the
    // "@/*" -> "./src/*" mapping explicitly here, the same pattern already
    // used above for the ".js"-suffix extensionAlias fix.
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.join(import.meta.dirname, "src"),
    };
    return config;
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
