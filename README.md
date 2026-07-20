# COLREGS Navigator

[![CI](https://github.com/MarouenAbdi/colregs-navigator/actions/workflows/ci.yml/badge.svg)](https://github.com/MarouenAbdi/colregs-navigator/actions/workflows/ci.yml)

Maritime collision-avoidance rules engine and visualizer. Users place two vessels on a
nautical-chart-style sandbox and the app classifies the encounter (head-on, crossing, or
overtaking) under the International Regulations for Preventing Collisions at Sea (COLREGS
Rules 11-18), determines which vessel must give way, and explains the verdict with the
specific rule citation and geometric reasoning behind it.

## Local Setup

Prerequisites:

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or an equivalent local
  Docker daemon) -- provides the local Postgres database. **There is no hosted/live deployment
  for this milestone** -- the project is demoed via local run instructions only, not a hosted
  live link (local Docker Postgres only, no Neon/Supabase or other managed DB).
- Node.js 22+

Steps, in order:

```bash
cp .env.example .env
docker compose up -d
npm install
npx prisma migrate dev
npm test
```

`docker compose up -d` starts a local Postgres 17 container (credentials and database name are
defined in `docker-compose.yml`, matching the connection string in `.env.example`).
`npx prisma migrate dev` applies the committed migrations under `prisma/migrations/` and
generates the Prisma client. `npm test` runs the Vitest suite (domain rules engine plus any
persistence/API tests).

## Deployment

**No live hosted deployment exists yet** -- provisioning a real host and database is Phase 15
scope, not this milestone's current phase. What already exists, fully authored and locally
verified against this repo's own docker-compose Postgres, is the production build path itself:

- `"vercel-build"` (`package.json`): `prisma generate` -> an environment-gated
  `scripts/migrate-if-production.mjs` -> `next build --webpack`. The migration step only runs
  `prisma migrate deploy` when `VERCEL_ENV === "production"`, so a PR/branch preview build (which
  runs this identical script with a different `VERCEL_ENV` value) can never apply a migration to
  a live database. Both gate states, and the full three-step sequence ending in a confirmed
  webpack build, have been verified locally.
- CD-01's actual auto-deploy-on-merge mechanism will be the eventual host's native Git
  integration (e.g. Vercel watching `main`), not a hand-rolled GitHub Actions deploy step -- this
  milestone's locked architecture decision keeps GitHub Actions scoped to CI only.
- The same `.nvmrc` this repo already uses for CI is what the eventual host will resolve its Node
  version from -- no separate host-specific Node version configuration is expected.

## Linting & Code Quality

```bash
npm run lint       # eslint . -- reports violations, exits non-zero on any new error
npm run lint:fix   # eslint . --fix -- applies safe autofixes first
```

ESLint is configured via a flat `eslint.config.mjs`, combining `@next/eslint-plugin-next`'s
`core-web-vitals` rules, Tailwind v4-aware linting (`eslint-plugin-better-tailwindcss`), and
Vitest-specific correctness rules (`@vitest/eslint-plugin`, scoped to `src/**/*.test.{ts,tsx}`).

**Mechanically lint-enforced** (a lint error, not just a convention in this file):

- The `src/domain/` architecture boundary (CLAUDE.md's "hard rule to enforce") -- a
  `no-restricted-imports` rule blocks `src/domain/` from importing `src/server/`, Next.js, tRPC,
  or Prisma.
- Stale Phase/Plan/REQ-ID comment references -- a repo-local `local/no-stale-id-comments` rule
  (`eslint-rules/no-stale-id-comments.mjs`) catches rotting pointers like `Phase 3` or `04-01` in
  comments, repo-wide.
- Raw CSS composed as template-literal strings in component files -- a content-gated
  `no-restricted-syntax` rule flags `background-image`/`animation`/`gradient` strings built in
  `.tsx` files, without flagging the sanctioned single-CSS-custom-property pattern
  (`style={{ "--rotation": \`${angle}deg\` }}`).

**Still human-reviewed, not mechanically enforced** (per CLAUDE.md's conventions but outside what
a lint rule can practically check): near-identical JSX duplication across two data instances (e.g.
two vessels, two badges), and whether a comment explains the *why* rather than restating the
*what*. These require judgment a static rule can't reliably apply without false positives.

`eslint-suppressions.json` (repo root) tracks pre-existing violations discovered when ESLint was
first retrofitted onto this already-built codebase (via `eslint --fix --suppress-all`) -- it is a
visible, diffable debt ledger for code this milestone didn't touch, not a mechanism for disabling
rules. Suppressed counts are tracked per file+rule, not per individual violation: a new violation
in an already-suppressed file+rule combination is only caught if it pushes that file's count for
the rule above the previously recorded number -- fixing one violation while introducing another
in the same file+rule can mask the new one. Periodically re-running `eslint --fix --suppress-all`
and diffing the resulting file against the committed version is the way to audit for drift.

### Known limitation: no type-checked ESLint tier

This project has no `typescript-eslint`-powered, type-aware ESLint tier (`recommended`,
`recommended-type-checked`, or `strict-type-checked`) -- and this is a deliberate, documented gap,
not an oversight. `typescript-eslint`'s peer-dependency range (`typescript: ">=4.8.4 <6.1.0"`,
checked across all published versions including `canary`) does not cover this project's locked
`typescript@7.0.2` (tsgo) compiler; `@typescript-eslint/parser` crashes at require-time against it
(`Cannot read properties of undefined (reading 'Cjs')`) because tsgo doesn't export the classic
TypeScript compiler internals that parser reads. Installing `typescript-eslint` at all would
reintroduce that crash, so this toolchain instead parses `.ts`/`.tsx` files with
`@babel/eslint-parser` for syntax only (no type information, no `any`-aware rules). Type safety
itself is unaffected and fully covered separately by `npm run typecheck` (`tsc --noEmit`), which
runs against the real tsgo compiler. Revisit this limitation if/when a `typescript-eslint` release
adds tsgo support.
