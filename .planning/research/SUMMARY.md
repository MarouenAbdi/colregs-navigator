# Project Research Summary

**Project:** COLREGS Navigator — v1.3 "CI/CD & Deployment" milestone
**Domain:** CI/CD pipeline + first-ever live deployment for an existing Next.js 16 / React 19 / TypeScript 7 (tsgo) / tRPC 11 / Prisma 7 / PostgreSQL portfolio app
**Researched:** 2026-07-20
**Confidence:** HIGH-MEDIUM (toolchain mechanics and official docs are HIGH; hosting/DB free-tier pricing and final platform pick are MEDIUM — genuinely fast-moving and partly a user decision)

## Executive Summary

This milestone doesn't introduce a new product domain — it wires an already-built, already-tested Next.js/tRPC/Prisma app into its first CI pipeline and first real production deployment. All four research tracks converge on the same architecture: GitHub Actions owns CI only (lint, typecheck, test, build — as a merge gate), and the hosting platform's native Git integration owns CD (auto-deploy on merge to `main`), with **Vercel + Neon** as the recommended host/DB pair because they are the cleanest fit for this project's existing `@prisma/adapter-pg` driver-adapter pattern, are genuinely free and non-expiring at portfolio-traffic scale, and wire together natively (Neon's Vercel Marketplace integration auto-injects `DATABASE_URL`). Husky 9 + lint-staged handles pre-commit hygiene (staged-file ESLint only — full typecheck deliberately stays out of pre-commit and lives in CI, and optionally `pre-push`).

The single biggest risk this research surfaces is that this is the **first time** several already-written, already-working pieces of this codebase run outside the original developer's warm local machine: the Prisma client has never been generated on a clean checkout (`generated/prisma` is gitignored, no `postinstall` script exists), the mandatory `next build --webpack` flag has never been verified against a host's auto-detected build command, and `tsc --noEmit` (tsgo) has never run as CI's authoritative type gate now that `next.config.ts` disables Next's own broken internal type-checker. Each of these is a "looks done but isn't" trap directly analogous to a precedent this project has already hit once (Turbopack's silent `resolve.extensionAlias` incompatibility, undiscovered for four phases). The mitigation pattern is consistent across all four research files: don't trust "build passes locally" or "CI job is green" as proof — explicitly verify a truly clean checkout, a real hosted build, and a real post-idle-period request before calling any part of this milestone done.

The recommended approach is deliberately proportional to a solo-authored portfolio project reviewed by a technical interviewer: real CI, real CD, real production DB, real health check and rollback story — but explicitly *no* staging environment, Kubernetes, blue-green deploys, secrets manager, or observability stack. FEATURES.md is explicit that over-scoping here is exactly as visible a judgment failure to a reviewer as under-scoping (no CI at all) — this milestone is itself a demonstration of proportional engineering judgment, not a tool checklist.

## Key Findings

### Recommended Stack

The stack additions are almost entirely configuration, not new runtime dependencies: `actions/checkout@v7`, `actions/setup-node@v7` (with `cache: npm` and `node-version-file: '.nvmrc'`), Husky 9.1.7 + lint-staged 17.0.8 (dev-only), and two external platform choices — **Vercel** (hosting) and **Neon** (managed Postgres). No production npm package is added. Existing tooling (Prisma 7.8.0's `migrate deploy`, the already-scripted `npm run lint/typecheck/test/build`) is reused as-is.

**Core technologies:**
- Vercel (hosting): first-party Next.js maintainer, zero-Dockerfile, non-expiring free Hobby tier at this project's traffic scale, native Neon Marketplace wiring
- Neon (Postgres): scale-to-zero compute fits sporadic portfolio-review traffic far better than Supabase's always-on-compute-with-7-day-pause model; pooled/unpooled URL pair maps directly onto the existing `@prisma/adapter-pg` pattern
- Husky 9.1.7 + lint-staged 17.0.8: standard, current, `prepare`-script-based git hook pattern — staged-file ESLint only, no new lint rules
- `actions/checkout@v7` / `actions/setup-node@v7`: latest verified tags via live GitHub API, not training data

Note: `.nvmrc` does not currently exist in the repo and should be added — every research track (STACK, ARCHITECTURE, PITFALLS) independently flags Node-version pinning as a prerequisite so local/CI/host never silently drift.

### Expected Features

**Must have (table stakes):**
- GitHub Actions CI: lint + typecheck + test + build, triggered on `pull_request` and `push:main`, with branch protection making all four required status checks (a red CI run that doesn't block merge is "theater," per FEATURES.md)
- README CI status badge
- CD: real auto-deploy on merge to `main` (via host-native Git integration, not a hand-rolled Actions deploy step run alongside it — the dual-deploy pattern is a named anti-pattern)
- `prisma migrate deploy` (never `migrate dev`/`db push`) wired into the deploy path against production Postgres
- A minimal `/api/health` endpoint doing a real DB connectivity check
- Husky + lint-staged pre-commit hook (ESLint on staged files only)
- `CONTRIBUTING.md` (carries forward locked requirement `DOCS-CONTRIB-01`): setup, running checks locally, pre-commit hook behavior, branch/commit conventions, PR expectations, rollback note

**Should have (differentiators):**
- A short documented rationale for *not* running a redundant Actions deploy step (shows judgment, not just tool usage)
- PR preview deployments (free if the host is Vercel/Netlify — do not hand-roll)
- Dependabot config (one file, zero custom code)
- `npm audit --audit-level=high` as a non-blocking, report-only CI step
- A CD-decision ADR entry (host choice, DB choice, deploy-trigger mechanism) — reuses the project's existing ADR practice

**Defer (explicitly out of scope this milestone):**
- Staging environment / multi-env promotion pipeline
- Kubernetes / Docker orchestration
- Blue-green/canary/traffic-shifting deploys
- Dedicated secrets-management system (Vault, etc.)
- Custom observability stack (Grafana/Prometheus)
- Matrix CI build strategy across Node versions/OSes

### Architecture Approach

CI (GitHub Actions) and CD (the hosting platform's native Git integration) are treated as two separate, decoupled systems — Actions never deploys anything; it is purely a pre-merge and post-merge correctness gate. The host's own build script (`vercel-build`, auto-preferred over `build` when present) is the single place where Prisma-client generation, an environment-gated `prisma migrate deploy` (only on real production builds, never PR previews), and the mandatory `next build --webpack` flag all run together. `docker-compose.yml` (already in the repo) is reused verbatim as CI's ephemeral test database rather than re-declared as a separate GitHub Actions `services:` block, keeping local dev and CI on one definition.

**Major components:**
1. `.github/workflows/ci.yml` — single job (no matrix needed at this scale): lint, typecheck, test (needs Docker Postgres), build
2. Host's native Git integration (Vercel recommended) — the actual CD mechanism, triggered independently by a push to `main`
3. `vercel-build` script (or host-equivalent) — `prisma generate` → environment-gated `prisma migrate deploy` → `next build --webpack`, the one place production migrations and the mandatory webpack flag are guaranteed to run together
4. Husky (`.husky/pre-commit` → lint-staged; optionally `.husky/pre-push` → full `npm run typecheck`) — local-only, fast-first enforcement layer
5. Production Postgres (Neon) — standard `postgresql://` wire protocol, no driver/adapter change needed from the existing `@prisma/adapter-pg` + `pg` setup

Two secret stores are kept fully separate and non-overlapping: CI's test DB uses the already-public dev credentials from `.env.example`/`docker-compose.yml` (not a GitHub secret at all), while the real production `DATABASE_URL` lives only in the hosting platform's own environment-variable store — GitHub Actions never needs to hold a production credential under this architecture.

### Critical Pitfalls

1. **`generated/prisma` client never regenerated on a clean checkout** — `output` is gitignored and there's no `postinstall` script; every CI job and the first host build will fail immediately on import resolution unless `prisma generate` (or a `"postinstall": "prisma generate"` script) runs explicitly. This blocks the entire CI phase, not just the build job — fix first.
2. **Old `?connection_limit=` URL-param advice is dead on arrival for driver adapters** — Prisma 7 + `@prisma/adapter-pg` delegates pool sizing entirely to `pg.Pool` constructor options (`max`, `connectionTimeoutMillis`), not connection-string params; under serverless concurrency the default pool size (10) times several warm function instances can exhaust a free-tier connection cap. Cap `max` explicitly and prefer Neon's pooled endpoint.
3. **Host build command silently diverging from `package.json`'s `next build --webpack`** — this project has direct precedent (Turbopack's silent `resolve.extensionAlias` incompatibility, undetected for four phases). Never trust a host's framework auto-detection; explicitly verify the build log shows webpack, not Turbopack, on the very first real deploy.
4. **Unsafe or unconditional `prisma migrate deploy`** — must be environment-gated (e.g. `VERCEL_ENV === "production"`) so a PR preview build can never apply a migration to the live database; `migrate dev`/`db push` must never appear in any CI/CD script.
5. **Free-tier DB auto-suspend stacking with serverless cold starts** — the exact failure mode that could hit a portfolio demo on the one occasion that matters most (an interviewer's first click after days of inactivity). Neon's fast, transparent resume is preferred over Supabase's full 7-day project pause; test the live deploy after a genuine overnight idle period before calling it demo-ready.

(Six more pitfalls are documented in PITFALLS.md, including Husky hooks silently not registering on a fresh clone, forked-PR GitHub Actions secret unavailability, `.env` leak risk once a real production credential exists, and Node-version drift across local/CI/host — all mapped to specific phases below.)

## Implications for Roadmap

Based on combined research, suggested phase structure:

### Phase 1: CI Foundation
**Rationale:** Nothing else in this milestone can be verified without a working CI pipeline first, and this phase surfaces the "first time on a clean checkout" pitfalls (Prisma client generation, Node pinning, macOS-vs-Linux native binaries) before deployment adds a second, harder-to-debug environment on top.
**Delivers:** `.github/workflows/ci.yml` (lint + typecheck + test + build, triggered on `pull_request` + `push:main`), `.nvmrc`, `"postinstall": "prisma generate"`, Docker-Postgres-backed test job reusing the existing `docker-compose.yml`, branch protection requiring all jobs, README CI badge.
**Addresses:** GitHub Actions CI table-stake, dependency caching, required status checks, README badge (FEATURES.md P1 items).
**Avoids:** Pitfalls 1 (Prisma client never regenerated), 5 (Node version drift), 6 (macOS/Linux native-binary mismatch), 8 (forked-PR secrets — resolved by using a service/Docker container, not a hosted-DB secret).

### Phase 2: Pre-commit Hooks & Contributor Docs
**Rationale:** Independent of hosting/DB choice, so it can proceed in parallel with or immediately after Phase 1; sequenced before deployment because `CONTRIBUTING.md` should document real hook behavior, not an aspirational one (per FEATURES.md's explicit dependency note).
**Delivers:** Husky 9 + lint-staged (staged-file `eslint --fix` only, full typecheck deliberately kept out of pre-commit), a `.env*` staged-file guard rule, `CONTRIBUTING.md` covering setup/checks/hook behavior/branch conventions/PR expectations/rollback note.
**Addresses:** HOOKS-01 and DOCS-CONTRIB-01 locked requirements; the "full typecheck in pre-commit" anti-pattern is explicitly avoided.
**Avoids:** Pitfall 7 (Husky hooks silently not firing on fresh clone — verify via an actual scratch clone + `npm ci`), Pitfall 9 (`.env` leak risk, addressed here as a cheap pre-commit guard before a real production credential exists).

### Phase 3: Hosting & Database Provisioning
**Rationale:** CD mechanism and the `prisma migrate deploy` step both depend on which host/DB is selected — this is explicitly a decide-then-build item per PROJECT.md, not pre-lockable before Phase 1/2. Comes after CI exists so the very first deploy can be validated against a pipeline that already proves lint/typecheck/test/build are healthy.
**Delivers:** Vercel project linked to the GitHub repo (native Git integration for CD), Neon project provisioned and wired via the Vercel Marketplace integration (auto-injected `DATABASE_URL`/`DATABASE_URL_UNPOOLED`), `vercel-build` script (Prisma generate → environment-gated `migrate deploy` → `next build --webpack`), all `.env.example` variables configured in Vercel's Production environment.
**Uses:** Vercel + Neon (STACK.md), `@prisma/adapter-pg` pool configuration (`max` capped explicitly).
**Implements:** The CI/CD-decoupled architecture pattern (ARCHITECTURE.md Pattern 1) and the environment-gated migration script (Pattern 2).

### Phase 4: Go-Live Verification & Operational Signal
**Rationale:** "Green CI" and "green build" are not the same claim as "actually works when deployed" — this project has direct precedent for that gap (Turbopack). This phase is the explicit verification gate the pitfalls research insists on, not an assumed byproduct of Phase 3.
**Delivers:** `/api/health` endpoint (real DB connectivity check), a verified real end-to-end request against the live deploy (not just a green build log), a post-idle-period (overnight) load test to catch DB-suspend/cold-start stacking, a documented rollback story (host's one-click "promote a previous deployment"), optional Dependabot config and non-blocking `npm audit` step, a short ADR entry for the CD mechanism decision.
**Delivers (verification checklist, not code):** confirms host build command literally matches `package.json`'s `build` script; confirms pool sizing is adapter-level, not a URL param; confirms every `.env.example` variable exists in the host's Production scope.
**Avoids:** Pitfalls 3 (build-command mismatch), 10 (env-var misconfiguration on first deploy), 11 (free-tier auto-suspend + cold-start compounding).

### Phase Ordering Rationale

- CI must exist before deployment is attempted, because CI is what proves the app builds/tests/typechecks correctly on a clean, non-macOS-warm checkout — deploying without this first would conflate "new hosting environment" bugs with "never actually verified outside my machine" bugs.
- Pre-commit hooks are independent of hosting and can run in parallel with or right after CI, but must precede (or land alongside) `CONTRIBUTING.md`'s hook-behavior section so documentation doesn't describe aspirational behavior.
- Hosting/DB selection is deliberately its own phase, not folded into CI, because PROJECT.md leaves it as a locked "research-then-decide" item and because the CD mechanism and migration step both depend on which host is picked (Vercel vs. an Actions-driven deploy is a real either/or, not "always add both").
- Go-live verification is split into its own final phase specifically because "build passes" and "actually deployed and works" are different claims — every research track flags this as the single most likely source of a "looks done but isn't" failure in this milestone, directly citing this project's own Turbopack precedent.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3 (Hosting & Database Provisioning):** hosting/DB provider free-tier limits and exact Vercel Marketplace/Neon wiring steps are dashboard-driven and pricing pages shift; verify current limits and exact click-path at implementation time rather than trusting this research's snapshot.
- **Phase 4 (Go-Live Verification):** whether `next build` performs any server-side data fetch against the database at build time (e.g., a statically-pre-rendered gallery of curated `Scenario` rows) is an explicitly flagged open gap in STACK.md — needs empirical verification (a real `npm run build` against a freshly-migrated, unseeded DB) before assuming the build step doesn't also need seed data.

Phases with standard patterns (skip research-phase):
- **Phase 1 (CI Foundation):** GitHub Actions lint/typecheck/test/build shape is extremely well-documented and directly mirrors this project's own already-working local scripts — low novelty.
- **Phase 2 (Pre-commit Hooks & Docs):** Husky v9 + lint-staged is a mature, unchanged-for-2-years pattern with strong multi-source corroboration.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH for Actions/Husky/lint-staged versions (live GitHub API + Context7 verified); MEDIUM for Vercel/Neon free-tier pricing specifics (cross-checked 2026 sources, but pricing pages change) |
| Features | HIGH for CI/CD structure, badges, Husky/lint-staged division (multi-source corroborated); MEDIUM for health-check conventions and Vercel-vs-Actions redundancy specifics (fewer authoritative primary sources) |
| Architecture | MEDIUM-HIGH — HIGH on toolchain-specific gotchas (tsgo, Prisma 7 config behavior, Vercel build-command override, all verified against official docs/GitHub issues); MEDIUM on final hosting-platform pick, which this research deliberately defers to the user |
| Pitfalls | HIGH for Prisma 7 driver-adapter/pooling behavior and Husky `prepare`-script mechanics (official docs + multiple community sources); MEDIUM for hosting-provider free-tier specifics and GitHub Actions caching/forked-PR-secrets mechanics (official docs language + community confirmation, fast-moving pricing) |

**Overall confidence:** HIGH on mechanism/architecture/pitfall-avoidance; MEDIUM on the specific hosting/DB vendor pricing details that could shift before implementation.

### Gaps to Address

- **Does `next build` touch the database at build time?** (e.g., statically pre-rendered curated Scenario gallery). Flagged as an open, unresolved question in STACK.md — resolve empirically during Phase 4 by running `npm run build` locally against a freshly-migrated, unseeded database before assuming either outcome.
- **Exact current Vercel/Neon free-tier numeric limits** — MEDIUM confidence, pricing-page-dependent; re-verify at the time Phase 3 is actually implemented rather than trusting this document's snapshot.
- **`@testing-library/user-event` version** — noted in STACK.md as MEDIUM confidence (registry lookup was interrupted); not load-bearing for this milestone specifically (it matters for vessel-drag UI tests from earlier milestones) but worth a quick verification pass if touched.
- **Whether the host ultimately chosen is Vercel** — all architecture and pitfalls guidance is written host-agnostic where possible but is most concretely verified for Vercel specifically; if Netlify or another host is chosen instead during Phase 3, the `vercel-build`-script-specific mechanics (Pattern 2) need a host-equivalent translation (e.g., Netlify's build plugins/environment context).

## Sources

### Primary (HIGH confidence)
- GitHub API live lookups (`actions/checkout`, `actions/setup-node` latest release tags)
- Context7 `/llmstxt/prisma_io_llms_txt`, `/typicode/husky` — official Prisma Migrate/Vercel deployment patterns, Husky v9 `prepare`-script mechanics
- Official docs: Prisma (Migrate Deploy, Deploy to Vercel, database connections), Vercel (Configuring a Build, Hobby plan), Neon (connection pooling, Prisma guide, Vercel Marketplace integration), GitHub Docs (status badges), Render (free Postgres 30-day expiry changelog), Next.js (Turbopack default bundler blog post, SWC binary failure docs)
- GitHub issues on official repos: `prisma/prisma#28869`/`#28590`/`#28708` (env-var config fix in Prisma 7.2.0+), `microsoft/typescript-go#1507` (tsgo CI-performance data)
- Direct repository inspection: `package.json`, `next.config.ts`, `eslint.config.mjs`, `prisma/schema.prisma`, `prisma.config.ts`, `src/server/db/client.ts`, `docker-compose.yml`, `.env.example`, `.gitignore`, `README.md`, `.planning/PROJECT.md`

### Secondary (MEDIUM confidence)
- [Vercel Knowledge Base: GitHub Actions with Vercel](https://vercel.com/kb/guide/how-can-i-use-github-actions-with-vercel) — redundant-deploy anti-pattern
- [Netlify: Next.js 16 deploy support changelog](https://www.netlify.com/changelog/next-js-16-deploy-on-netlify/)
- [Railway pricing docs](https://docs.railway.com/pricing/plans), [Supabase pricing breakdown](https://designrevision.com/blog/supabase-pricing) — free-tier comparison data
- [Better Stack: Husky and lint-staged guide](https://betterstack.com/community/guides/scaling-nodejs/husky-and-lint-staged/)
- [GitHub community discussion #196886](https://github.com/orgs/community/discussions/196886) — forked-PR secret behavior
- Multiple independent 2026 Neon-vs-Supabase comparison articles (designrevision.com, dev.to, closefuture.io, kunalganglani.com) — cross-checked, converging on same free-tier suspend/pause claims

### Tertiary (LOW confidence)
- None flagged as standalone LOW-confidence claims in this milestone's research; all findings above are at least MEDIUM (cross-checked or official) with specific gaps called out above rather than left implicit.

---
*Research completed: 2026-07-20*
*Ready for roadmap: yes*
