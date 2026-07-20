# Stack Research

**Domain:** CI/CD pipeline (GitHub Actions), pre-commit hooks (Husky/lint-staged), and a live production deployment (hosting + managed Postgres) for an existing Next.js 16 / React 19 / TypeScript 7 (tsgo) / tRPC 11 / Prisma 7 / PostgreSQL portfolio app
**Researched:** 2026-07-20
**Confidence:** HIGH (GitHub Actions action versions, Prisma docs, Husky docs — all verified via GitHub API/Context7) / MEDIUM (hosting & DB free-tier pricing specifics — verified via multiple independent 2026 sources but pricing pages change over time)

## Scope Note

This document **replaces** the prior `STACK.md` (v1.2 Tech Debt & Stabilization — ESLint/lint-tooling research, dated 2026-07-19). That research is shipped and locked (ESLint via `@next/eslint-plugin-next` + `@babel/eslint-parser`, bypassing `typescript-eslint`/`eslint-config-next` due to `typescript@7.0.2`/tsgo incompatibility — see `eslint.config.mjs`, already in the codebase). This document covers ONLY the new decisions v1.3 introduces: CI/CD workflow, pre-commit hooks, hosting platform, and Postgres provider. The existing stack (Next.js 16.2.10, React 19.2.7, TypeScript 7.0.2, Tailwind 4.3.2, tRPC 11.18.0, Prisma 7.8.0, Zod 4.4.3, Vitest 4.1.10 + RTL) is validated and locked — not re-researched here.

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `actions/checkout` | v7.0.0 | Checks out the repo in the CI runner | Confirmed as the current latest tag via a live GitHub API call (`api.github.com/repos/actions/checkout/releases/latest`) at research time — HIGH confidence, not training data |
| `actions/setup-node` | v7.0.0 | Installs Node.js and enables npm dependency caching in CI | Confirmed as the current latest tag via the same live GitHub API method. Supports `node-version-file` (point at a committed `.nvmrc`) and built-in `cache: 'npm'`, avoiding a separate `actions/cache` step |
| Vercel (hosting) | current (2026) | Next.js hosting; CD on merge to `main`; PR preview deployments | First-party Next.js maintainer — runs App Router, Server Actions, ISR, and this project's already-locked `next build --webpack` (not Turbopack) build with zero Dockerfile. Hobby tier is free and non-expiring at this project's traffic scale (see full comparison below) |
| Neon (Postgres) | current (2026) | Production PostgreSQL database | Purpose-built serverless Postgres with a native Vercel Marketplace integration (auto-injects `DATABASE_URL`/`DATABASE_URL_UNPOOLED` into the Vercel project) and a PgBouncer-compatible pooled endpoint — a direct fit for this project's existing `@prisma/adapter-pg` (`pg.Pool`)-based driver-adapter pattern against serverless function invocations |
| Husky | 9.1.7 | Git hooks manager | Current stable release (unchanged for ~2 years — mature, not stale). v9's `prepare: "husky"` + `.husky/pre-commit` shell-script pattern is the only current supported pattern (the old JSON-config v4-v8 approach is deprecated) |
| lint-staged | 17.0.8 | Runs lint/typecheck only against staged files at commit time | Current release; requires Node `>=22.22.1` — this project's local Node (`v22.23.1`, confirmed via `node -v`) already satisfies this with no upgrade needed |

### Supporting Libraries / Config (no new production runtime dependencies)

| Library/Config | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `prisma migrate deploy` (already-installed `prisma` CLI, `7.8.0`) | 7.8.0 | Applies committed migrations to a database non-interactively | Run as a CD step right after each deploy to production, and as a CI step against the ephemeral test database before `npm test` runs. Never use `prisma migrate dev` in CI/CD — it's interactive-by-design and can create/reset migrations, which is not CI-safe |
| `postgres:17` (Docker service container) | 17 | Ephemeral test database inside the CI job | `src/server/db/scenario-repository.test.ts` is an explicit, unmocked integration test against a live Prisma client (its own header comment: "Integration tests ... against the live Docker Postgres instance ... no mocking of `prisma`"). CI must run the identical image via a GitHub Actions `services:` container — mocking Prisma here would test something different from what runs locally and in production |
| `CONTRIBUTING.md` | — | Contributor-facing setup/workflow doc | Carries forward `DOCS-CONTRIB-01` — document the Docker-Postgres-first local setup (already in `README.md`), the lint/typecheck/test/build gate, and the new Husky pre-commit hook so contributors understand what a rejected commit means |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| GitHub Actions `services:` container | Provides Postgres for the CI test job | Match `docker-compose.yml`'s exact image (`postgres:17`) and credentials (`colregs`/`colregs`/`colregs_navigator`, per `.env.example`) so CI and local `npm test` can never silently diverge |
| GitHub Actions status badge | README CI badge (carries forward `CI-01`) | Standard Markdown, no library needed: `` ![CI](https://github.com/<org>/<repo>/actions/workflows/ci.yml/badge.svg) `` |
| `.nvmrc` (recommend adding — does not currently exist in this repo, verified) | Single source of truth for Node version across local dev, Husky hooks, and CI | Pin to `22` (or the exact local `22.23.1`) and point `actions/setup-node`'s `node-version-file: '.nvmrc'` at it, so CI/local/Husky never drift on the Node version both `tsgo` (needs Node 20+) and `lint-staged` (needs Node ≥22.22.1) depend on |

## Installation

```bash
# Husky + lint-staged (dev dependencies only — no new production/runtime deps)
npm install -D husky lint-staged
npx husky init

# Nothing to `npm install` for CI/CD, hosting, or the database — GitHub Actions,
# Vercel, and Neon are configured via YAML and dashboard/CLI linking, not npm
# packages. Prisma 7.8.0 and the pg driver adapter are already installed and
# need no CI-specific additions.
```

## GitHub Actions Workflow Structure (given `tsgo` + webpack-not-Turbopack)

A single `ci.yml`, one job, is the right shape at this project's scale — one Node version, one OS (`ubuntu-latest`), a modest test suite. No matrix is needed. Step order, with the DB-independent steps first to fail fast on the common case:

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:17
        env:
          POSTGRES_USER: colregs
          POSTGRES_PASSWORD: colregs
          POSTGRES_DB: colregs_navigator
        ports: ["5432:5432"]
        options: >-
          --health-cmd pg_isready
          --health-interval 5s
          --health-timeout 5s
          --health-retries 5
    env:
      DATABASE_URL: postgresql://colregs:colregs@localhost:5432/colregs_navigator?schema=public
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version-file: ".nvmrc"   # or node-version: '22' if .nvmrc isn't added
          cache: "npm"
      - run: npm ci
      - run: npx prisma generate
      - run: npx prisma migrate deploy
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test
      - run: npm run build             # already scripted as `next build --webpack`
```

Non-obvious, project-specific reasoning behind each step (verified against this repo's actual files, not assumed):

- **`npx prisma generate` must be an explicit CI step.** There is no `postinstall: "prisma generate"` in `package.json`, and `generated/prisma/` is gitignored (both `generated/` and `prisma/generated/` are listed in `.gitignore`). Locally this is currently masked because the README's onboarding steps run `npx prisma migrate dev` (which also generates the client) before anything else. CI has no equivalent step by default — a bare `npm ci && npm run typecheck` on a fresh runner will fail with a "Cannot find module '../../../generated/prisma/client.js'" error (the exact relative import in `src/server/db/client.ts`). This is a real, concrete gap this milestone needs to close, verified by reading the actual import path and `.gitignore`, not a hypothetical.
- **`prisma migrate deploy` (never `migrate dev`) against the ephemeral service-container Postgres**, run before `npm test`, because the repository's own integration test explicitly runs unmocked against a live schema — it needs the migrations applied, and `migrate deploy` is Prisma's own documented non-interactive command for pipelines (confirmed via Context7 `/llmstxt/prisma_io_llms_txt`).
- **No Turbopack anywhere in CI.** The existing `build` script is already `next build --webpack` (locked via `next.config.ts`'s `resolve.extensionAlias`/`resolve.alias` config plus `package.json`'s `--webpack` flag) — CI just runs `npm run build` verbatim and inherits the same webpack config. No CI-only build flag or extra step is needed.
- **`typescript.ignoreBuildErrors: true` in `next.config.ts` means `next build` does NOT catch type errors** — that flag exists specifically because Next 16.2.10's bundled type-checker crashes against `typescript@7.0.2`/tsgo (per this project's own documented finding in `next.config.ts`'s comments). This makes the separate `npm run typecheck` (`tsc --noEmit`, i.e. tsgo's CLI entry point) CI step load-bearing, not redundant — if it's ever dropped from the workflow, type errors will silently ship through a green build.
- **Open gap, flagged rather than asserted:** whether `next build` performs any server-side data fetch against the database at build time (e.g. if the home page's gallery section statically pre-renders curated `Scenario` rows). If it does, the CI build step needs the DB not just migrated but seeded (`prisma/seed.ts`) before `npm run build` runs. Verify this empirically (run `npm run build` locally against a freshly-migrated, unseeded database) during CI implementation rather than assuming either outcome.

## Hosting Platform Comparison (Next.js 16 + tRPC server routes + Postgres)

| Criterion | **Vercel** (recommended) | Netlify | Railway |
|---|---|---|---|
| Next.js 16 fit | First-party maintainer — App Router, Server Actions, ISR, image optimization all work with zero extra config | Netlify's Next.js Runtime explicitly supports Next.js 16 as of their 2026 changelog, handling SSR/ISR/Server Actions via Netlify Functions + Edge Functions | Auto-detects Next.js via Nixpacks/Railpack and runs it more like a long-lived container than a framework-aware host — works, but without Vercel/Netlify's framework-specific request routing/caching optimizations |
| tRPC server routes | Native — tRPC's Next.js adapter runs as any other route handler, zero special config | Supported — Netlify's SDK documents a tRPC integration, and their 2026 docs explicitly call tRPC v11 + App Router "stable" | Works (it's just Node), but you own keeping a long-running process healthy instead of relying on a managed serverless/edge runtime |
| Free/hobby tier | Hobby: 100GB data transfer/mo, 1M function invocations/mo, 4 Active-CPU-hrs/mo, non-expiring — Vercel's ToS prohibit commercial/revenue use on Hobby (a portfolio/demo site is squarely fine) | Comparable shape (100GB bandwidth, 300 build minutes/mo), but historically thinner Next.js-specific ISR/caching support than Vercel's own first-party runtime | No durable perpetual free tier: 30-day trial with a one-time $5 credit, then a Free plan giving only ~$1/mo credit (1 vCPU/0.5GB RAM) — not enough to run an always-on Next.js app *and* Postgres together without hitting the credit ceiling within days |
| CD on merge to `main` | Native, zero-config — connect the GitHub repo, every push to `main` auto-deploys to production, every PR gets a preview URL | Same pattern (native GitHub integration, PR deploy previews) | Native GitHub integration exists, more commonly paired with the app tier alone rather than a bundled free DB add-on |
| Setup effort | Lowest — dashboard "Import Project" or `vercel link`, no Dockerfile | Low — one framework-detection step; Next.js-specific runtime nuances (ISR/Server Actions) are a newer/less battle-tested adapter path than Vercel's own | Low for the app itself; the real constraint is cost, not setup effort |
| Verdict | **Recommended.** Best Next.js fit, genuinely-free non-expiring Hobby tier for portfolio traffic, native Neon Marketplace integration | Credible second choice if avoiding Vercel specifically — functionally works for this stack in 2026, worth a smoke test before committing | Not recommended as the app host this milestone — its free tier is a trial, not a durable free option, once a real Postgres instance is also running |

**Fly.io and Render were considered and are not recommended as the primary host.** Fly.io requires writing and maintaining a Dockerfile and manually handling build/runtime concerns that Vercel/Netlify give away for free at this project's size — real added cost with no corresponding benefit for a 2-vessel portfolio sandbox with no long-lived stateful process or WebSocket requirement. Render is a reasonable app host in the abstract, but its own free-tier Postgres product (below) now expires after 30 days, which rules it out as a DB provider regardless of app-hosting choice.

## Managed Postgres Provider Comparison (Prisma-backed)

| Criterion | **Neon** (recommended) | Supabase | Railway Postgres |
|---|---|---|---|
| Free tier shape | 100 CU-hrs/month compute (doubled from 50 in Oct 2025), 0.5GB storage/project, up to 100 projects, 10 branches/project — compute auto-suspends after ~5 min idle (scale-to-zero) | 500MB database, 1GB file storage, up to 2 projects — compute runs continuously (no scale-to-zero), and free projects **auto-pause after 7 days of inactivity**, requiring a manual dashboard "unpause" | No standalone perpetual free Postgres — billed against the same $5/mo Hobby credit pool as the app itself, so app + DB together commonly cost $3-8/mo even at "hobby" scale |
| Fit for sporadic portfolio traffic | Excellent — scale-to-zero compute billing means near-zero cost/usage for a demo checked out in bursts (interview reviews), not constant traffic | Weaker fit — always-on compute burns the (smaller) free allowance even when idle, and the 7-day auto-pause risks showing an interviewer a cold-start "unpause" screen after a quiet week | Same concern as its app-hosting tier: no durable no-cost path once a DB is added alongside the app |
| Connection model / Prisma fit | Ships both a direct endpoint and a `-pooler` (PgBouncer, transaction-mode) endpoint per branch — pairs directly with this project's existing `@prisma/adapter-pg` (`pg.Pool`) pattern: pooled URL as `DATABASE_URL` for the running app (serverless-function-safe), direct/unpooled URL as a separate `DIRECT_URL` for `prisma migrate deploy` in CI/CD | Also offers a pooler (Supavisor) — functionally comparable, but adds product surface (Auth, Storage, Realtime) this project has no requirement for (no auth in scope per `PROJECT.md`) | Standard Postgres; no purpose-built serverless-pooling product distinct from Railway's general networking layer |
| Vercel integration | **Native Vercel Marketplace integration** — installing it auto-creates a Neon project and injects `DATABASE_URL`/`DATABASE_URL_UNPOOLED` (plus legacy `POSTGRES_*` vars) directly into the Vercel project's env vars for Production/Preview/Development, and can auto-branch a Neon DB per PR preview deployment | Has its own Vercel integration, but is not marketed as tightly around this exact one-click env-var-wiring flow as Neon's (which effectively replaced Vercel's own now-discontinued "Vercel Postgres" product — itself originally Neon-backed) | No comparable native Vercel Marketplace database integration |
| Verdict | **Recommended.** Best cost fit for bursty portfolio traffic, cleanest Vercel wiring, and its pooled/unpooled URL pair maps directly onto this project's existing driver-adapter code with zero application-code changes | Viable alternative if the project later adds Auth/Storage/Realtime (all currently Out of Scope per `PROJECT.md`) — otherwise adds unused surface area for no benefit here | Not recommended as the DB provider — no durable free tier once combined with any app hosting |

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|--------------------------|
| Vercel (hosting) | Netlify | If avoiding lock-in to Vercel specifically is a priority, or Vercel Hobby limits are hit and Netlify's exact free-tier caps are more favorable at that point |
| Vercel (hosting) | Fly.io | If the roadmap later adds a genuinely long-lived stateful process (WebSocket server, background worker, self-hosted DB) a serverless host can't run — not the case for this milestone |
| Neon (Postgres) | Supabase | If a future milestone reintroduces auth/storage/realtime and one vendor for DB+auth+storage becomes preferable to composing separate services |
| Neon (Postgres) | Railway Postgres | Only if the app is already hosted on Railway for cost/consolidation reasons — otherwise no advantage over Neon here |
| GitHub Actions single job | GitHub Actions matrix (multiple Node versions/OSes) | If the project needs to support contributors on multiple Node majors or ships a cross-platform CLI — not applicable to a single-deployment-target Next.js app |
| Husky 9 + lint-staged | `pre-commit` (Python tool) / `simple-git-hooks` | If the team were polyglot (non-Node tooling) or wanted a lighter single-purpose git-hook installer without lint-staged's per-file filtering — not a fit since the whole toolchain (ESLint, tsgo, Vitest) is already Node-native |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Mocking/stubbing Prisma in the CI test step | `scenario-repository.test.ts` is explicitly an unmocked integration test against a live Postgres instance (per its own header comment) — mocking it in CI tests something different from what runs locally and in production, defeating the test's purpose | A real `postgres:17` GitHub Actions `services:` container, matching `docker-compose.yml` exactly |
| `prisma migrate dev` anywhere in CI/CD | Interactive-by-design; can prompt, generate new migration files, or reset the database — never CI-safe | `prisma migrate deploy` (non-interactive, applies only already-committed migrations) |
| Relying on `next build`'s built-in type-checking as the CI type-safety gate | `next.config.ts` already sets `typescript.ignoreBuildErrors: true` because Next 16.2.10's bundled checker crashes against `typescript@7.0.2` (tsgo) — a green `next build` on this repo currently proves nothing about type safety | Keep `npm run typecheck` (`tsc --noEmit`, tsgo's CLI entry point) as its own required CI step |
| Adding `typescript-eslint`/`eslint-config-next` to the pre-commit hook or CI lint step | Already established in this repo (v1.2, Phase 10) as incompatible with `typescript@7.0.2` — no published version of either supports tsgo. Re-adding either "just for CI" would silently break `npm ci` with a require-time crash | The existing `@next/eslint-plugin-next` + `@babel/eslint-parser` flat-config setup, run as-is in both the pre-commit hook and CI (`eslint .`) |
| Vercel Hobby tier for anything beyond this portfolio's traffic (revenue-generating or paid-customer use) | Vercel's Hobby ToS explicitly prohibit commercial use — not a fit problem for this project (an interview portfolio piece), but a real constraint to know if scope ever changes | Vercel Pro ($20/mo) if the project's purpose ever changes |
| Render's free Postgres as the production DB | Free Render Postgres instances now expire after 30 days (changed from 90 days in 2024) and are deleted after a further 14-day grace period unless upgraded to paid — incompatible with "a live deployment" meant to stay up indefinitely for interview review | Neon (scale-to-zero compute, no forced expiration on its free tier as of research date) |
| Railway as the sole app+DB host on its free/trial tier | No durable perpetual free tier once a real always-on app and a Postgres instance both run — the 30-day trial credit and post-trial $1/mo Free-plan credit are consumed quickly by a two-service (app + DB) setup | Vercel (app) + Neon (DB), each independently free and non-expiring at this project's traffic scale |
| Bundling a repo-wide Prettier pass into this milestone's lint-staged config | `FMT-01` (repo-wide Prettier reformatting) is an explicitly deferred v2 backlog item in `PROJECT.md`, not part of v1.3's scope — introducing Prettier now would reformat files this milestone isn't chartered to touch | Scope lint-staged to `eslint --fix` (already-configured rules) only; revisit Prettier as its own dedicated milestone (`FMT-01`) |

## Stack Patterns by Variant

**If the free-tier limits above are hit in practice (unlikely at portfolio-review traffic levels):**
- Upgrade only the specific service that hit its cap (Vercel Pro $20/mo, or Neon's paid compute tier) rather than migrating the whole stack
- Because both Vercel's and Neon's paid tiers are drop-in upgrades of the exact same integration already wired — no re-architecture needed

**If a future milestone adds user auth/accounts (currently Out of Scope per `PROJECT.md`):**
- Reconsider Supabase over Neon for the DB layer
- Because Supabase bundles Auth alongside Postgres, avoiding a second vendor integration — not worth it today since auth is explicitly out of scope

**If lint-staged's full-project typecheck step ever becomes too slow for a comfortable pre-commit experience:**
- Move the typecheck step from the `pre-commit` hook to a `pre-push` hook instead (keep `eslint --fix` on `pre-commit` for fast feedback)
- Because tsgo is materially faster than classic `tsc` (10x+ per multiple 2026 sources), but a growing test suite could still make even that small delay noticeable over time — `pre-push` still catches type errors before they reach CI/a PR, just with looser immediacy than every commit

## Husky + lint-staged Setup Pattern (given ESLint flat config + `tsgo`-based typecheck)

```bash
npm install -D husky lint-staged
npx husky init          # creates .husky/pre-commit, sets "prepare": "husky" in package.json
```

`.husky/pre-commit`:
```sh
npx lint-staged
```

`package.json` (`lint-staged` config block — task-function pattern for the project-wide typecheck):
```json
{
  "lint-staged": {
    "*.{js,jsx,mjs,cjs,ts,tsx}": ["eslint --fix"],
    "*.{ts,tsx}": [() => "npm run typecheck"]
  }
}
```

Why this shape, specific to this repo's tooling:
- `eslint --fix` is filtered to the staged files (lint-staged's default per-file glob-array behavior) since this project's flat config (`eslint.config.mjs`) already runs cleanly per-file via the babel-parser-based bypass — no project-wide type information is needed for ESLint to work here, unlike a `typescript-eslint`-based setup which requires a full `parserOptions.project` pass.
- `tsc --noEmit` (tsgo) cannot usefully typecheck a single file in isolation — it needs the whole project graph. The bracketed `() => "npm run typecheck"` task-function form (lint-staged's documented pattern for commands that shouldn't receive a filename list) runs the full existing `typecheck` script exactly once whenever any staged file matches `*.{ts,tsx}`, rather than passing individual filenames to `tsc`.
- No Prettier step — deliberately, since `FMT-01` (repo-wide reformatting) is an explicitly deferred v2 item; adding Prettier to lint-staged now would silently reformat any staged file, which is out of this milestone's scope.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|------------------|-------|
| `lint-staged@17.0.8` | Node `>=22.22.1` | This project's local Node (`v22.23.1`, confirmed via `node -v`) already satisfies this — no local upgrade needed. CI must pin `actions/setup-node` to an equal-or-newer Node 22.x to match, or lint-staged (invoked via Husky locally, not in CI itself) and CI could diverge on Node version without a shared `.nvmrc` |
| `typescript@7.0.2` (tsgo) | Node `20+` (per multiple 2026 TypeScript-Go sources); statically-linked Linux x64/arm64 binaries (`CGO_ENABLED=0`) | Confirms tsgo runs cleanly on `ubuntu-latest` GitHub Actions runners with no libc-dependency concerns — no special runner image needed |
| `prisma@7.8.0` + `@prisma/adapter-pg` | Any standard PostgreSQL connection string (Neon pooled/unpooled, Supabase, Railway, local Docker) | As of Prisma ORM 7, the query-compiler ("client") engine is the **default** — there is no Rust query-engine binary to worry about shipping or `binaryTargets`-configuring at all for this project's schema (already confirmed via `src/server/db/client.ts`'s own comment: "the Rust query-engine binary is gone in 7.x"). This is a meaningful simplification vs. older Prisma-5/6-era serverless-deployment guides that still discuss `binaryTargets = ["native", "rhel-openssl-1.0.x"]` — that guidance is obsolete for this project's Prisma version |
| Neon pooled connection string | Prisma driver adapters (`@prisma/adapter-pg`) | Neon's PgBouncer pooler (transaction mode) now supports prepared statements plus `DISCARD ALL`/`DEALLOCATE ALL`, so the pooled endpoint can safely run both app queries and (if desired) `prisma migrate deploy` — though using the separate unpooled/direct URL for migrations remains the more conservative, still-recommended pattern for CI/CD migration steps |
| `actions/setup-node@v7` | `node-version-file: '.nvmrc'` | Supported input as of setup-node v4+; recommended over hardcoding `node-version: '22'` in the workflow YAML once a `.nvmrc` exists, so local/Husky/CI all read one source of truth |

## Sources

- GitHub API (`api.github.com/repos/actions/checkout/releases/latest`, `.../actions/setup-node/releases/latest`) — HIGH confidence, live version lookup at research time, not training data
- Context7 `/llmstxt/prisma_io_llms_txt` — Prisma Migrate Deploy CI/CD workflow examples, confirmation that the query-compiler ("client") engine is the Prisma 7 default, Vercel serverless deployment driver-adapter pattern
- Context7 `/typicode/husky` — `husky init`, `prepare` script pattern, `.husky/pre-commit` file convention (current v9 pattern)
- [Prisma: Deploying database changes with Prisma Migrate](https://www.prisma.io/docs/orm/prisma-client/deployment/deploy-database-changes-with-prisma-migrate) — `migrate deploy` vs `migrate dev` in CI/CD
- [Prisma: Deploy to Vercel (serverless)](https://www.prisma.io/docs/orm/prisma-client/deployment/serverless/deploy-to-vercel) — driver-adapter + connection-pool deployment pattern
- [Vercel Hobby plan docs](https://vercel.com/docs/plans/hobby) / [Vercel pricing](https://vercel.com/pricing) — MEDIUM confidence, cross-checked against multiple independent 2026 summaries (deploywise.dev, fencode.dev) for Hobby-tier limits and the commercial-use restriction
- [Netlify: Next.js 16 is ready to deploy on Netlify](https://www.netlify.com/changelog/next-js-16-deploy-on-netlify/) — MEDIUM confidence, official changelog confirming Next.js 16 + Server Actions support
- [Netlify Next.js Runtime docs](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/) — MEDIUM confidence
- [Railway pricing docs](https://docs.railway.com/pricing/plans) — MEDIUM confidence, cross-checked against 3+ independent 2026 pricing breakdowns for the $5 Hobby-credit / no-perpetual-free-tier finding
- [Render: Free PostgreSQL instances now expire after 30 days](https://render.com/changelog/free-postgresql-instances-now-expire-after-30-days-previously-90) — HIGH confidence, official Render changelog
- [Neon connection pooling docs](https://neon.com/docs/connect/connection-pooling) — HIGH confidence, official docs; PgBouncer transaction-mode, pooled-vs-direct endpoint naming convention, prepared-statement support
- [Neon: Connect from Prisma to Neon](https://neon.com/docs/guides/prisma) — HIGH confidence, official docs; `DATABASE_URL` (pooled) + `DIRECT_URL` (unpooled) pattern for Prisma
- [Neon-Managed Vercel Integration docs](https://neon.com/docs/guides/neon-managed-vercel-integration) / [Neon for Vercel Marketplace](https://vercel.com/marketplace/neon) — HIGH confidence, official docs; auto env-var injection, per-PR branching
- [Supabase pricing 2026 breakdown](https://designrevision.com/blog/supabase-pricing) — MEDIUM confidence, single third-party source, internally consistent with Supabase's own publicly documented free-tier shape (500MB DB, 7-day auto-pause)
- [Node.js Learn: Running TypeScript Natively](https://nodejs.org/learn/typescript/run-natively) — MEDIUM confidence (official Node.js site) for the Node 20+ tsgo requirement
- [microsoft/typescript-go multi-platform packaging](https://deepwiki.com/microsoft/typescript-go/9.3-multi-platform-packaging-and-code-signing) — MEDIUM confidence (DeepWiki-generated, reflects the actual public repo's build matrix) for the Linux x64/arm64 statically-linked binary confirmation
- This repo's own files, read directly at research time (HIGH confidence, primary source): `package.json`, `next.config.ts`, `eslint.config.mjs`, `prisma/schema.prisma`, `prisma.config.ts`, `src/server/db/client.ts`, `src/server/db/scenario-repository.test.ts`, `docker-compose.yml`, `.env.example`, `README.md`, `.gitignore`

---
*Stack research for: CI/CD & Deployment milestone (v1.3), COLREGS Navigator*
*Researched: 2026-07-20*
