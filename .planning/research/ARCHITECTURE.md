# Architecture Research

**Domain:** CI/CD & deployment integration for an existing Next.js 16 / tRPC / Prisma 7 (tsgo) modular monolith
**Researched:** 2026-07-20
**Confidence:** MEDIUM-HIGH overall — HIGH on the toolchain-specific gotchas (tsgo, Prisma 7 config, Vercel build-command override), MEDIUM on final hosting-platform pick (locked decision defers that to the user)

## Standard Architecture

### System Overview

```
┌───────────────────────────── Pull Request ──────────────────────────────────┐
│  .github/workflows/ci.yml  (CI — gate, runs on every PR + push to main)      │
│  ┌────────┐  ┌───────────┐  ┌──────────────────┐  ┌─────────────────────┐   │
│  │  lint  │  │ typecheck │  │  test (needs DB)  │  │  build (needs DB    │   │
│  │ eslint │  │ tsc/tsgo  │  │  docker compose   │  │  url placeholder,   │   │
│  │        │  │ --noEmit  │  │  up -d --wait +   │  │  next build         │   │
│  │        │  │           │  │  migrate deploy   │  │  --webpack)         │   │
│  └────────┘  └───────────┘  └──────────────────┘  └─────────────────────┘   │
└───────────────────────────────────────────────────────────────────────────────┘
                                      │  merge to main (required checks green)
                                      ▼
┌───────────────────────── Host's native Git integration (CD) ────────────────┐
│  Vercel (recommended) / Railway / Render — auto-triggered by GitHub push     │
│  vercel-build script:                                                       │
│    prisma generate                                                          │
│    → if VERCEL_ENV === "production": prisma migrate deploy                  │
│    → next build --webpack                                                   │
│  DATABASE_URL sourced from the HOST's own env-var store (not a GH secret)   │
└───────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
                     Live app  ←→  Production Postgres (Neon/Railway/Supabase)

┌────────────────── Local machine (separate from the above) ──────────────────┐
│  Husky pre-commit → lint-staged (staged-file eslint --fix only, fast)       │
│  Husky pre-push  → npm run typecheck (full-repo tsc/tsgo, slower, optional) │
└───────────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| `.github/workflows/ci.yml` | PR/main gate: lint, typecheck, test, build must all pass before merge is allowed | One workflow, 4 jobs (can run in parallel matrix or sequentially); required status checks configured in branch protection |
| Host's Git integration (Vercel/Railway/Render) | Actual CD — auto-build + auto-deploy to production on every push to `main` | Native GitHub App connection; **no custom GH Actions "deploy" job needed** if this is used |
| `vercel-build` (or host-equivalent) script | Single source of truth for what actually happens during a production build: generate Prisma client → conditionally migrate → build | A `package.json` script Vercel auto-prefers over `build` when present |
| Husky | Registers local git hooks (`.husky/pre-commit`, `.husky/pre-push`) | v9+ shape: a plain shell script per hook, no `husky.sh` sourcing boilerplate needed |
| lint-staged | Runs fast, staged-file-only checks (ESLint `--fix`) at commit time | `lint-staged.config.js` or a `"lint-staged"` key in `package.json` |
| `docker-compose.yml` (already exists) | Local Postgres 17 for dev — **reused verbatim** as the CI test job's ephemeral DB | `docker compose up -d --wait` inside the GH Actions runner (Docker is preinstalled on `ubuntu-latest`) |
| Production Postgres provider | Durable, publicly-reachable Postgres instance backing the live app | Neon / Railway / Supabase — all expose a standard `postgresql://` connection string compatible with the project's existing `@prisma/adapter-pg` + `pg` driver, no adapter swap needed |

## Recommended Project Structure

```
.github/
└── workflows/
    └── ci.yml              # lint + typecheck + test + build, on pull_request + push:main
                             # (no separate deploy.yml — see Pattern 1 below)
.husky/
├── pre-commit              # runs `npx lint-staged`
└── pre-push                # runs `npm run typecheck` (full project — see Pattern 4)
lint-staged.config.js        # (or inline "lint-staged" key in package.json)
CONTRIBUTING.md              # new — carries forward DOCS-CONTRIB-01
README.md                    # modified — CI badge, "Live Deployment" section replacing the
                             # current "no hosted/live deployment for this milestone" note
package.json                 # modified — new devDeps (husky, lint-staged), new
                             # "vercel-build" / "prepare" scripts (see Pattern 2)
app/api/health/route.ts      # optional — trivial `{ status: "ok" }` GET route; useful as a
                             # post-deploy smoke-test target and for future uptime pings
                             # (not strictly required to satisfy the milestone's target
                             # features, but cheap and standard — flag as a nice-to-have,
                             # not a hard requirement)
vercel.json                  # optional — only needed if NOT using the `vercel-build` script
                             # convention; the script convention is preferred (see Pattern 2)
```

### Structure Rationale

- **One `ci.yml`, no `deploy.yml`:** given the realistic hosting candidates (Vercel, Railway, Render) all offer native GitHub-push-triggered deploys, a hand-rolled GitHub Actions deploy job would duplicate what the host already does for free, and would need its own copy of the production `DATABASE_URL` as a GH secret — a second copy of a production credential this architecture doesn't need to create. Keep GH Actions scoped to CI only.
- **`docker-compose.yml` reused, not reimplemented as a GH Actions `services:` block:** the file already exists, already matches `.env.example`'s credentials, and already pins `postgres:17`. A GH Actions `services:` block would be a second, independently-maintained definition of the same thing — a config-drift risk with zero benefit here.
- **`vercel-build` script over `vercel.json` `buildCommand`:** see Pattern 2 — this is the more idiomatic, single-file way to guarantee the project's mandatory `--webpack` flag and the migration-gating logic both survive Vercel's own build invocation.

## Architectural Patterns

### Pattern 1: CI (Actions) and CD (host Git integration) are separate, decoupled systems

**What:** GitHub Actions' job is exclusively "should this PR/commit be allowed to merge" — lint, typecheck, test, build-as-a-correctness-check. The actual production deployment is triggered independently by the hosting platform's own GitHub App watching `main`.

**When to use:** Whenever the chosen host has native git-push-to-deploy (true for Vercel, Railway, Render — all realistic candidates for this milestone's "free/hobby-tier" constraint). Only build a custom GH Actions deploy job if the eventual host lacks this (e.g., a raw VPS or Docker-only target).

**Trade-offs:** Simpler, fewer secrets, no duplicated build logic — but it does mean GH Actions' own "build" job and the host's production build are two separate builds of the same commit. That's acceptable here (cheap, and it's the standard industry pattern) — it is *not* redundant in the sense that matters: CI's build job is a merge gate that runs before human review completes, the host's build is what actually ships.

### Pattern 2: Environment-gated migration inside the host's own build script

**What:** Add a `vercel-build` script (Vercel auto-prefers this script name over `build` when present — this is Vercel's own documented mechanism for framework-integrated projects that need extra build steps) that runs Prisma generate unconditionally, but gates `prisma migrate deploy` behind the host's own "is this the real production deploy" signal (Vercel sets `VERCEL_ENV` to `production`/`preview`/`development` automatically; Railway/Render have equivalent variables).

**When to use:** Always, for this project — it is the only way to run migrations exactly once per real production deploy without ever risking a PR preview build silently applying a migration to the live database.

**Example:**
```json
{
  "scripts": {
    "build": "next build --webpack",
    "vercel-build": "prisma generate && node scripts/migrate-if-production.mjs && next build --webpack"
  }
}
```
```js
// scripts/migrate-if-production.mjs
import { execSync } from "node:child_process";

// Only the real production deploy (a push to `main`) should ever mutate the
// live schema -- Vercel's Preview Deployments (every PR/branch push) build
// with the same script but VERCEL_ENV="preview", so this guard is what
// stops a work-in-progress branch from running `migrate deploy` against
// production Postgres.
if (process.env.VERCEL_ENV === "production") {
  execSync("npx prisma migrate deploy", { stdio: "inherit" });
}
```

**Trade-off:** Ties the migration step to whichever host is chosen (the env-var name changes per platform) — acceptable since the migration step already has to live *somewhere* host-aware, and this keeps it in one file next to the rest of the deploy config rather than split across a GH Actions secret + workflow step.

### Pattern 3: Reuse the existing `docker-compose.yml` for CI's database-backed jobs

**What:** The `test` job (and, if migrations are also verified in CI, a dedicated `migrate-check` step) starts the *exact* file already used for local dev, rather than re-declaring Postgres via GH Actions' `services:` YAML key.

**When to use:** Whenever local dev already has a docker-compose Postgres definition (true here) — one definition, two consumers (dev machine, CI runner).

**Example (CI test job):**
```yaml
- name: Start Postgres
  run: docker compose up -d --wait
- name: Apply migrations
  run: npx prisma migrate deploy
  env:
    DATABASE_URL: postgresql://colregs:colregs@localhost:5432/colregs_navigator?schema=public
- name: Run tests
  run: npm test
  env:
    DATABASE_URL: postgresql://colregs:colregs@localhost:5432/colregs_navigator?schema=public
```
Note: these credentials are the same non-secret dev defaults already committed in `.env.example` and `docker-compose.yml` — nothing here needs a GitHub Actions secret, since this Postgres instance only ever exists for the lifetime of one CI run.

**Trade-off:** None significant — `docker compose up -d --wait` (the `--wait` flag respects the existing `healthcheck: pg_isready` block already defined) adds a few seconds of startup latency versus a bare `services:` container, which is negligible.

### Pattern 4: Full typecheck deferred out of pre-commit; lint-staged handles only staged-file lint

**What:** `lint-staged` runs ESLint (`--fix`) against staged files only, at `pre-commit`. `tsc --noEmit` (or `tsgo`/`npm run typecheck`) is **not** added to lint-staged at all — TypeScript's type-checker inherently needs the whole project graph, so scoping it to staged files produces misleading pass/fail results (a changed file's type errors can originate from an *unstaged* file it references). Run the full typecheck at `pre-push` instead (still local, still before code reaches GitHub, but off the hot path of every single commit), with CI's own `typecheck` job as the authoritative, un-skippable gate.

**When to use:** Always for this project, doubly so given the verified finding that `tsgo` in CI-class environments does **not** reliably deliver its marketed 10x speedup over classic `tsc` — a real-world GitHub Actions report measured only ~28% faster (57s vs 79s) on a 2-vCPU `ubuntu-latest` runner, because Go's goroutine-based parallelism has little headroom on shared 2-vCPU runners ([microsoft/typescript-go#1507](https://github.com/microsoft/typescript-go/issues/1507)). This project's codebase is much smaller than that report's 322K-line benchmark, so absolute time will be short regardless — but it confirms typecheck is not free, and should not gate every commit.

**Example (`lint-staged.config.js`):**
```js
export default {
  "*.{ts,tsx,js,jsx,mjs,cjs}": ["eslint --fix"],
};
```
```bash
# .husky/pre-commit
npx lint-staged

# .husky/pre-push
npm run typecheck
```

**Trade-off:** A contributor can still push code with a type error if they skip/force past `pre-push` — CI's `typecheck` job is what actually can't be bypassed (assuming branch protection requires it as a status check), so pre-push is a convenience, not the safety boundary.

## Data Flow

### Request Flow (CI → CD)

```
PR opened/updated
    ↓
GH Actions ci.yml (pull_request trigger)
    → lint job            (npx prisma generate [dummy DATABASE_URL] → eslint .)
    → typecheck job        (npx prisma generate [dummy DATABASE_URL] → tsc --noEmit)
    → test job             (docker compose up -d --wait → prisma migrate deploy → vitest run)
    → build job            (npx prisma generate [dummy DATABASE_URL] → next build --webpack)
    ↓ (all 4 required, branch-protection-gated)
Merge to main
    ↓
GH Actions ci.yml re-runs on push:main (same 4 jobs, re-validates post-merge state)
    ↓ (independently, in parallel)
Vercel GitHub App detects push to main
    → vercel-build script: prisma generate → [VERCEL_ENV=production ⇒ prisma migrate deploy] → next build --webpack
    → deploy → live app updated
```

### Key Data Flows

1. **Migration flow:** a single set of committed files (`prisma/migrations/*/migration.sql`) flows through three environments with zero divergence: local dev (`prisma migrate dev`, already established), CI's ephemeral test Postgres (`prisma migrate deploy` against the docker-compose container), and production (`prisma migrate deploy`, gated to real production builds only via Pattern 2). No environment ever runs a different migration path (e.g. `db push` or `migrate reset`) — that's what makes `migrate deploy` safe for a live DB: it only ever applies pending, already-reviewed migration files in order, never destructively resets.
2. **Secret flow:** two entirely separate `DATABASE_URL` values live in two separate stores that never need to overlap. (a) The CI test job's DB credentials are the already-public dev defaults from `.env.example`/`docker-compose.yml` — not a secret, needs no GitHub Secret at all. (b) The production `DATABASE_URL` lives only in the hosting platform's own environment-variable store (Vercel Project Settings → Environment Variables, scoped to "Production"), because migration + runtime both happen inside the host's own build/runtime, not from a GitHub Actions runner reaching out to the internet. This means, in the recommended architecture, **GitHub Actions never needs to hold a production database credential at all** — a smaller secret-exposure surface than a design where an Actions job calls out to prod directly.

## Scaling Considerations

| Concern | At portfolio-demo scale (few users) | If traffic grows meaningfully |
|---------|--------------------------------------|-------------------------------|
| DB connections | Fine as-is — Vercel serverless functions + a single Prisma Client instance per invocation, low concurrency | First real bottleneck: serverless functions can each open their own Postgres connection, quickly exhausting a free-tier connection cap (Neon/Railway free tiers cap concurrent connections). Fix is a pooled connection string (Neon's built-in pooler endpoint, or PgBouncer) — the project's existing `@prisma/adapter-pg` + `pg` driver works unchanged against a pooled connection string, no code change needed, just swap which connection string `DATABASE_URL` points at |
| CI runtime | Negligible (small codebase, ~seconds per job) | If it grows, split lint/typecheck/test/build into a matrix that runs in parallel (already the recommended shape) rather than one long sequential job |
| Migration risk | Low — single-developer workflow, migrations reviewed in PRs before merge | Add a "migration diff / destructive-change" check (e.g. a CI step that fails if a migration contains `DROP COLUMN`/`DROP TABLE` without an explicit override) before this becomes a multi-contributor project |

## Anti-Patterns

### Anti-Pattern 1: Running the full-project `tsc`/`tsgo` typecheck in `pre-commit`

**What people do:** Add `tsc --noEmit` (or `npm run typecheck`) directly into `lint-staged`'s file-glob config, hoping it scopes to changed files.
**Why it's wrong:** TypeScript's checker needs the whole project's type graph — scoping to staged files produces false negatives (misses errors from cross-file references) and is also slow on every commit, and per the verified `tsgo`-in-CI finding above, this compiler's parallelism gains are constrained on shared/limited-core machines, so it's not free even with the new compiler.
**Instead:** lint-staged does ESLint only; full typecheck runs at `pre-push` (optional local safety net) and unconditionally in CI (the real gate).

### Anti-Pattern 2: Assuming `next build`'s own type-checking covers CI's typecheck requirement

**What people do:** Rely on `next build` to fail the pipeline if there's a type error, skipping a dedicated `tsc --noEmit` CI step.
**Why it's wrong:** This project's `next.config.ts` already sets `typescript.ignoreBuildErrors: true`, *specifically* because Next 16.2.10's built-in type-checker hardcodes a TypeScript Program-API entry point that the tsgo-based `typescript@7.0.2` package no longer ships — `next build` cannot type-check this project at all right now (documented, verified, in the existing config's own comment). Skipping a separate typecheck step would mean **no type-checking whatsoever** runs in CI.
**Instead:** `npm run typecheck` (`tsc --noEmit`) must be its own explicit CI job — it already is the project's authoritative type gate locally; CI must mirror that.

### Anti-Pattern 3: Leaving Vercel's "Build Command" on pure framework auto-detect for this project

**What people do:** Deploy a Next.js repo to Vercel and leave the Build Command field unset, trusting the "Next.js" framework preset to do the right thing (Vercel's own docs recommend exactly this for standard projects).
**Why it's wrong:** Next.js 16 made Turbopack the default bundler for **both** `next dev` and `next build` — webpack is "no longer the default," and opting out requires the explicit `--webpack` CLI flag (a `webpack:` function in `next.config.ts` alone is not sufficient to opt out). This project depends on that flag: without it, Turbopack is used, which does not support `resolve.extensionAlias`, and the build fails on the very first `.js`-suffixed relative import (~98 imports across 37 files, per this project's own Key Decisions log — this already happened once, in Phase 5). Vercel's own build-configuration docs are explicit that custom build flags need an explicit override (`vercel.json`'s `buildCommand`, or the dashboard's Override field) rather than being inferred from `package.json`'s `build` script content for framework-detected projects.
**Instead:** Do not rely on Vercel's zero-config default. Either (a) add the `vercel-build` script shown in Pattern 2, which Vercel auto-prefers and which explicitly ends in `next build --webpack`, or (b) explicitly set `buildCommand` in `vercel.json`/Project Settings. Verify this concretely on the very first deploy (check the build log for "Turbopack" vs. the expected webpack output) before treating CD as working — this is exactly the kind of toolchain assumption that has bitten this project before (Turbopack/webpack, tsc/tsgo Program API).

### Anti-Pattern 4: Unconditional `prisma migrate deploy` in the build command

**What people do:** Add `prisma migrate deploy && next build` as the literal build command with no environment gate.
**Why it's wrong:** Every PR/branch preview build on Vercel would also run this build command, meaning a branch that isn't merged yet could apply a migration to the live production database the moment its preview deployment builds — the actual live data at risk, not a sandboxed copy.
**Instead:** Gate the migration step behind the host's own production-vs-preview signal (Pattern 2).

### Anti-Pattern 5: Duplicating the production `DATABASE_URL` into GitHub Actions Secrets "just in case"

**What people do:** Add the real production connection string as a GitHub Actions secret even though no Actions job actually touches production.
**Why it's wrong:** Every secret copy is an additional exposure surface (visible to anyone with write access to workflow files, any Actions runner, any third-party Action used in the workflow) with no corresponding benefit if the recommended architecture (Pattern 1/2) is followed.
**Instead:** Production `DATABASE_URL` lives only in the hosting platform's own environment-variable store, scoped to "Production." GitHub Actions only ever needs the disposable, already-public dev credentials for its own ephemeral test Postgres.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| GitHub Actions | `.github/workflows/ci.yml`, triggered on `pull_request` and `push: main`; 4 jobs (lint, typecheck, test, build); branch protection marks all 4 as required status checks | `actions/checkout@v4`, `actions/setup-node@v4` pinned to **Node 22** (matches README's documented local prerequisite, "Node.js 22+"), `cache: npm` |
| Hosting platform (Vercel recommended; Railway/Render viable alternates) | Native GitHub App — auto-deploys `main` on every merge; no GH Actions involvement | Must explicitly set the build command/script per Anti-Pattern 3 — do not trust zero-config defaults given the mandatory `--webpack` flag |
| Production Postgres (Neon/Railway/Supabase — pick one) | Standard `postgresql://` connection string, compatible as-is with the existing `@prisma/adapter-pg` + `pg` driver | No driver/adapter change needed regardless of provider — this project does **not** use `@prisma/adapter-neon`'s HTTP driver, so any standard-Postgres-wire-protocol host works without touching `src/server/db/client.ts` |
| Husky + lint-staged (local, not a "service" but the local-tooling integration point) | `.husky/pre-commit` → `npx lint-staged`; `.husky/pre-push` → `npm run typecheck` | Husky v9+ shape: no `#!/usr/bin/env sh\n. "$(dirname "$0")/_/husky.sh"` boilerplate needed — hook files are plain executable scripts; `"prepare": "husky"` in `package.json` installs the git hooks on `npm install` |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `package.json` scripts ↔ `.github/workflows/ci.yml` | CI calls `npm run lint` / `npm run typecheck` / `npm test` / `npm run build` directly — the workflow is a thin wrapper, never re-implements these commands inline | Keeps a single source of truth for "what does lint/typecheck/test/build mean" — local dev and CI never drift |
| `prisma.config.ts` ↔ every CI job that shells out to `prisma` (including `prisma generate` in lint/typecheck/build jobs) | `prisma.config.ts` calls `env("DATABASE_URL")`, which is a documented Prisma 7 behavior that historically threw a hard `PrismaConfigEnvError` if `DATABASE_URL` was unset at config-load time — **even for commands like `generate` that never open a connection** ([prisma/prisma#28869](https://github.com/prisma/prisma/issues/28869), [#28590](https://github.com/prisma/prisma/issues/28590)). This was fixed upstream in **Prisma 7.2.0**; this project is locked to `^7.8.0`, comfortably past that fix, so `prisma generate` should succeed with no `DATABASE_URL` set at all. **Recommendation (defense-in-depth, not strictly required):** set a placeholder `DATABASE_URL` (e.g. `postgresql://placeholder:placeholder@localhost:5432/placeholder`) as a non-secret repo/workflow-level env var for the `lint`, `typecheck`, and `build` jobs anyway — it's zero-cost insurance against any future Prisma patch regressing this, and removes any ambiguity about whether the fix applies to every subcommand this project's scripts invoke. |
| `next.config.ts`'s `typescript.ignoreBuildErrors: true` ↔ CI's dedicated `typecheck` job | The config comment already documents *why* this flag exists (tsgo/Next 16 Program-API mismatch) — CI's `typecheck` job is the component that makes this flag safe to have set at all; if that job is ever removed from the required-checks list, type safety silently stops being enforced anywhere | Treat the `typecheck` CI job as load-bearing infrastructure, not a "nice to have" alongside lint |
| `docker-compose.yml` ↔ CI `test` job | CI starts the *same* file, not a re-declared equivalent | See Pattern 3 |

## Sources

- [Configuring a Build — Vercel Docs](https://vercel.com/docs/builds/configure-a-build) — MEDIUM-HIGH confidence, official docs; confirms custom build flags for framework-detected projects need explicit `buildCommand` override, and that `vercel-build` / framework auto-detect is the standard split
- [Next.js 16 — Turbopack default bundler](https://nextjs.org/blog/next-16) and multiple corroborating secondary sources (akoskm.com, ishu.dev, progosling.com) — MEDIUM-HIGH confidence (official Next.js blog + consistent secondary coverage); confirms webpack opt-out requires the explicit `--webpack` flag, not just a webpack config block, as of Next.js 16
- [microsoft/typescript-go#1507](https://github.com/microsoft/typescript-go/issues/1507) — MEDIUM confidence (single GitHub issue, closed as "needs more info," but concrete measured numbers on `ubuntu-latest`); used to temper the "10x faster" marketing claim for tsgo specifically in shared/constrained CI runners
- [`@typescript/native-preview` npm package](https://www.npmjs.com/package/@typescript/native-preview) and [`@typescript/native-preview-linux-x64`](https://www.npmjs.com/package/@typescript/native-preview-linux-x64?activeTab=dependencies) — HIGH confidence, official npm registry metadata; confirms the platform-specific-binary-via-`optionalDependencies` mechanism (same pattern as esbuild/swc) that makes `npm ci` on a Linux GitHub Actions runner correctly resolve the Linux-x64 native tsgo binary with no special CI configuration
- [prisma/prisma#28869](https://github.com/prisma/prisma/issues/28869), [#28590](https://github.com/prisma/prisma/issues/28590), [#28708](https://github.com/prisma/prisma/issues/28708) — HIGH confidence, official GitHub issues on the `prisma` repo; confirms the `env()`-throws-even-for-`generate` behavior and that it was fixed in 7.2.0+ (this project is locked to `^7.8.0`, past the fix)
- [Deploying database changes with Prisma Migrate — Prisma Docs](https://www.prisma.io/docs/orm/prisma-client/deployment/deploy-database-changes-with-prisma-migrate) and [Deploy to Vercel — Prisma Docs](https://www.prisma.io/docs/orm/prisma-client/deployment/serverless/deploy-to-vercel) — HIGH confidence, official Prisma documentation; source of the `migrate deploy`-as-a-deploy-step pattern and the `postinstall`/build-script Prisma Client generation pattern for custom `output` paths
- [prisma/prisma discussion #11131](https://github.com/prisma/prisma/discussions/11131) and [#26422](https://github.com/prisma/prisma/discussions/26422) — MEDIUM confidence, community discussion on the official repo; corroborates "decouple migration from build where possible, gate by environment"
- Husky/lint-staged 2026 sourcing (PkgPulse guide, Better Stack, dev.to threads) — MEDIUM confidence, multiple consistent secondary sources; used for the "typecheck at pre-push not pre-commit, lint-staged for staged-file linting only" pattern, which is also independently justified by this project's own verified tsgo-CI-performance finding above
- Direct repository inspection (`package.json`, `next.config.ts`, `tsconfig.json`, `prisma/schema.prisma`, `prisma.config.ts`, `vitest.config.ts`, `docker-compose.yml`, `.env.example`, `README.md`) — HIGH confidence, ground truth for every project-specific claim in this document (Node 22+ requirement, `--webpack` flag, custom Prisma `output` path, live-DB-backed test suite, existing docker-compose credentials, no existing `.github/`/`.husky`/`CONTRIBUTING.md`)

---
*Architecture research for: CI/CD & Deployment integration, COLREGS Navigator v1.3*
*Researched: 2026-07-20*
