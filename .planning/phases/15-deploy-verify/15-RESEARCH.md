# Phase 15: Deploy & Verify - Research

**Researched:** 2026-07-20
**Domain:** Vercel + Neon Postgres production deployment, Vercel CLI-driven verification, Next.js health-check Route Handler
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Provisioning Ownership**
- D-01: Neither a Vercel nor a Neon account exists yet — both require fresh sign-up.
- D-02: The user will do 100% of the manual account creation and dashboard configuration themselves (Vercel project/repo import, Neon project creation, entering env vars in Vercel's production environment). Claude does **not** drive this via browser automation. Claude's job is to produce a clear, ordered checklist for the user to follow, then verify the result afterward.
- D-03: Post-setup verification is done via the **Vercel CLI with a token** (`vercel login` / `VERCEL_TOKEN`), not just public HTTP checks against the live URL. The plan should include a step for the user to generate/provide this token.
- D-04: The Vercel CLI token's scope is **read + trigger deploy actions** — Claude may run CLI commands that trigger a deploy or promote/rollback a deployment, not just read-only inspection (listing deployments, viewing logs). This is what makes a live, CLI-driven verification of HEALTH-04's rollback path possible, rather than only confirming the button/flow exists.

**Health Check Design (`/api/health`)**
- D-05: Checks **DB connectivity only** — a lightweight real query (e.g. `SELECT 1` or a trivial Prisma call), not app version/uptime/commit metadata.
- D-06: Response is simple JSON + status code: `200 {status: "ok"}` when the DB is reachable, `503 {status: "error"}` when it isn't — no internal error details (stack traces, connection strings) leaked in the body.
- D-07: **No explicit timeout** on the DB check — let the query take as long as it needs, bounded only by Vercel's own function timeout. A slow-but-successful Neon cold-start wake-up must still report healthy, not be falsely marked unhealthy by an artificial timeout.
- D-08: Response must be **explicitly non-cacheable** (`no-store` / equivalent) — every hit, including the HEALTH-03 overnight-idle check, must genuinely re-run the DB check rather than serve a stale cached response from Vercel's edge network.

**Phase boundary:** No code changes are expected to `vercel-build`, `scripts/migrate-if-production.mjs`, or the Prisma/adapter setup — those are locked from Phase 14. The only new code this phase should produce is the `/api/health` route handler.

### Claude's Discretion
- **Rollback verification method** — whether to actually exercise a live deploy->rollback cycle or just confirm the mechanism/documentation. D-04's CLI scope (read + trigger deploy actions) makes a live exercise possible; researcher/planner should decide based on risk/cost during planning. (This research recommends the live exercise — see Common Pitfalls #5/#6 and Code Examples' rollback cycle.)
- **Overnight idle verification logistics (HEALTH-03)** — how to structure the required real time gap across sessions (e.g. a scheduled wake-up check vs. the user manually confirming next session). This phase cannot complete in a single execution pass; the plan must account for a genuine wait period.

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope. (The "Claude's Discretion" items above were left open for researcher/planner, distinct from scope creep.)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-------------------|
| DEPLOY-01 | App is deployed to a hosting platform (Vercel) with a real, publicly-reachable production URL | Architecture Patterns (system diagram), Code Examples (`vercel ls`/`vercel inspect` verification), Environment Availability |
| DEPLOY-02 | Production Postgres (Neon) is provisioned and wired to the app | Summary's primary finding (direct vs. pooled connection string), Common Pitfalls #1/#2, Standard Stack |
| DEPLOY-03 | All required environment variables (per `.env.example`) are configured in the host's production environment | Summary, Open Question 2, Code Examples (`vercel env ls`) |
| HEALTH-01 | `/api/health` endpoint performs a real DB connectivity check and returns a meaningful status | Architecture Patterns Pattern 1 (full code), Don't Hand-Roll |
| HEALTH-02 | Live deployment is verified end-to-end with a real request | Architecture Patterns (system diagram), Code Examples |
| HEALTH-03 | Live deployment is verified to survive a post-idle-period request (overnight test) | Common Pitfalls #7, Open Question 1 |
| HEALTH-04 | A documented rollback procedure exists (host's one-click "promote a previous deployment") | Common Pitfalls #5/#6, Code Examples (rollback verification cycle), Don't Hand-Roll |
</phase_requirements>

## Summary

This phase connects Phase 14's already-authored, locally-verified `vercel-build` script to a real Vercel project and a real Neon Postgres database, then proves the result works — including a DB-backed `/api/health` endpoint, a genuine end-to-end request, an overnight idle-survival check, and a live-exercised rollback. Almost everything here is host/dashboard configuration (owned entirely by the user per CONTEXT.md D-02) plus CLI verification (owned by Claude via an authenticated `VERCEL_TOKEN`, per D-03/D-04). Exactly one new file of code is in scope: `app/api/health/route.ts`.

The single highest-value finding from this research is a **connection-string incompatibility that is not yet visible in the codebase**: Neon's pooled connection strings (the ones its Vercel marketplace integration injects by default) route through PgBouncer in transaction mode, and Prisma's Migrate/Schema Engine — including in Prisma 7 with driver adapters — does not support running `migrate deploy` through PgBouncer (confirmed independently by both Prisma's and Neon's own docs: "prepared statement already exists" / "Prisma Migrate does not support PgBouncer"). Because this project's locked scope is exactly **one** environment variable (`DATABASE_URL`, per `.env.example` and CONTEXT.md's explicit "no code changes" constraint), the correct resolution — with zero code changes and zero new env vars — is to put Neon's **unpooled/direct** connection string (no `-pooler` in the hostname) into that single `DATABASE_URL` value. This lets `vercel-build`'s `prisma migrate deploy` step succeed and lets the existing `PrismaPg` adapter (`src/server/db/client.ts`) keep working unmodified for runtime queries too. This also means the user should **not** use Neon's one-click "Vercel-Managed Integration"/marketplace connect flow as-is (it defaults to injecting the pooled string) — CONTEXT.md's D-02 (100% manual entry) already points this direction, and this research confirms *why* manual entry of the direct string is the right call, not just a preference.

The second key finding resolves the two open questions CONTEXT.md left for this research: Vercel's `vercel rollback`/`vercel promote <deployment-id>` against an **already-built, previously-production** deployment is documented as "Instant Rollback" — a domain/alias reassignment with **no rebuild**, confirmed by two separate official Vercel doc pages. This makes HEALTH-04 safely and cheaply exercisable live (push a trivial commit -> new prod deploy -> `vercel rollback` back to the prior one -> verify -> re-promote forward) without any risk of a stray migration re-run, because Instant Rollback never re-invokes `vercel-build`.

**Primary recommendation:** Use Neon's direct (unpooled) connection string as the sole `DATABASE_URL` value in Vercel's Production environment; verify everything post-setup via `npx vercel` (no global install) authenticated with `VERCEL_TOKEN`; build `/api/health` as a `runtime = "nodejs"`, explicitly `no-store` Route Handler that runs one real query through the existing `prisma` singleton; treat HEALTH-03/HEALTH-04 as genuinely time-boxed, multi-session verification steps, not something to fake or skip.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Hosting / public URL (DEPLOY-01) | CDN / Static (Vercel platform) | — | Vercel's native Git integration owns build + domain aliasing; no app code involved |
| Production Postgres provisioning (DEPLOY-02) | Database / Storage (Neon) | API/Backend (Prisma) | Neon owns compute/storage; Prisma (already locked in Phase 14) owns the migration/query interface |
| Env var configuration (DEPLOY-03) | CDN / Static (Vercel project settings) | — | Purely a host dashboard configuration action, no runtime code reads env vars differently |
| `/api/health` DB check (HEALTH-01) | API / Backend (Next.js Route Handler) | Database / Storage | Route Handler is the entry point; the real work is a round-trip query to Neon via the existing Prisma singleton |
| End-to-end live request (HEALTH-02) | Browser / Client (verification only) | API/Backend | A real HTTP request from outside the deploy, hitting both the frontend and the health API |
| Overnight idle survival (HEALTH-03) | Database / Storage (Neon scale-to-zero) | API/Backend (Vercel Function cold start) | Two independent cold-start mechanisms stack: Neon's compute suspend/resume and Vercel's serverless function cold start |
| Rollback verification (HEALTH-04) | CDN / Static (Vercel deployment/alias system) | — | Instant Rollback operates purely at the alias/routing layer, never touches the database or re-runs a build |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vercel CLI | 56.4.0 (verified via `npm view vercel version` and `npx vercel --version`, current at research time) | Non-interactive project linking, deployment listing, env var auditing, promote/rollback | Official Vercel tool; the only supported way to script deploy-management actions outside the dashboard `[VERIFIED: npm registry]` |
| Neon (Postgres) | N/A (managed service, no package) | Production Postgres, already locked as the project's DB choice from earlier milestone research | Serverless scale-to-zero fits sporadic portfolio traffic; native `@prisma/adapter-pg` compatibility (locked, Phase 14) |
| Next.js Route Handlers | 16.2.10 (already locked, project dependency) | `/api/health` implementation | Existing convention in this repo (`app/api/trpc/[trpc]/route.ts`); no new dependency |

No new npm packages are added to `package.json` by this phase. `/api/health` is plain TypeScript using already-installed `next`, `@prisma/client`/`@prisma/adapter-pg` (Phase 14-locked), and the existing `prisma` singleton import. The Vercel CLI is invoked via `npx vercel` (transient, not installed as a project dependency) so it never appears in `package.json`/`package-lock.json`.

### Supporting
None. No new libraries are required for `/api/health` — it needs no request-body parsing, no new schema, and D-05 explicitly rules out returning app metadata that might tempt a "system info" package.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Neon direct/unpooled `DATABASE_URL` (single var) | Neon pooled `DATABASE_URL` + new `DIRECT_URL` var + `prisma.config.ts` edit | Would require a code change and a second env var — both explicitly locked out of scope by CONTEXT.md. Only reconsider if the direct connection genuinely hits Neon's `max_connections` ceiling in practice (unlikely at this project's traffic scale — see Common Pitfalls). |
| `npx vercel` (transient) | `npm install -g vercel` | Global install works identically but adds an unmanaged, unversioned global tool; `npx vercel@56.4.0 <cmd>` (or unpinned `npx vercel`) keeps every invocation explicit and reproducible without touching `package.json`. |
| Vercel CLI + `VERCEL_TOKEN` | Neon's own "Vercel-Managed Integration" one-click connect | Rejected per CONTEXT.md D-02 (user wants manual dashboard control) and because the integration defaults to a *pooled* `DATABASE_URL`, which breaks `migrate deploy` (see Common Pitfalls) — manual entry of the correct connection string variant is required either way. |

**Installation:**
No `npm install` needed. Vercel CLI is invoked ad hoc:
```bash
npx vercel --version
VERCEL_TOKEN=<token> npx vercel whoami
```

**Version verification:** `npm view vercel version` returned `56.4.0` (matches `npx vercel --version` output captured directly in this environment). This is the current version as of research date; Vercel CLI ships frequent minor releases, so re-verify with `npx vercel --version` at execution time rather than hardcoding this number into any script.

## Package Legitimacy Audit

No new packages are installed by this phase. `vercel` is invoked transiently via `npx` and is never added to `package.json`/`package-lock.json` (verified: an earlier `slopcheck install vercel` accidentally ran `npm install vercel` during this research session — that change was reverted with `git checkout -- package.json package-lock.json` and confirmed clean via `git status`).

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| `vercel` | npm | Years (official Vercel CLI, actively released) | Very high (millions/week class) | github.com/vercel/vercel | [OK] | Approved — invoked via `npx`, not installed as a dependency |

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
[Developer: git push to main]
        |
        v
[GitHub: main branch] --(native Git integration, no Actions step)--> [Vercel: Production Build]
        |                                                                    |
        |                                                       prisma generate
        |                                                                    |
        |                                                   node scripts/migrate-if-production.mjs
        |                                                       (VERCEL_ENV === "production" gate)
        |                                                                    |
        |                                                              prisma migrate deploy
        |                                                                    |
        |                                                                    v
        |                                                       [Neon Postgres: direct connection]
        |                                                                    |
        |                                                          next build --webpack
        |                                                                    |
        v                                                                    v
[Public Vercel URL] <----------------- alias assigned ----------- [New immutable deployment]
        |
        |  real HTTP GET /api/health
        v
[Next.js Route Handler: runtime=nodejs, no-store]
        |
        |  SELECT 1 (or trivial Prisma call) via existing prisma singleton
        v
[Neon Postgres: direct connection, same DATABASE_URL]
        |
        v
  200 {status:"ok"}  <-- or -->  503 {status:"error"}  (query failed)

[Claude: VERCEL_TOKEN via CLI, out-of-band]
        |
        +--> vercel env ls              (confirm DATABASE_URL present, value not printed)
        +--> vercel ls / vercel inspect  (confirm deployment READY, list history)
        +--> curl the public URL         (HEALTH-02 real end-to-end request)
        +--> vercel rollback <prev-id>   (HEALTH-04: alias reassignment only, no rebuild)
        +--> vercel promote <new-id>     (undo the rollback, restore forward state)
```

### Recommended Project Structure
```
app/
├── api/
│   ├── trpc/[trpc]/route.ts   # existing convention, unchanged
│   └── health/
│       └── route.ts           # NEW: this phase's only code deliverable
```

### Pattern 1: Minimal DB-backed health Route Handler
**What:** A `nodejs`-runtime, explicitly non-cached Route Handler that runs one trivial query through the existing Prisma singleton and returns a plain JSON status + HTTP status code.
**When to use:** Exactly this phase's HEALTH-01/HEALTH-02/HEALTH-03 requirement — no timeout, no metadata, no auth.
**Example:**
```typescript
// Source: pattern assembled from Next.js official docs (Context7 /vercel/next.js —
// route segment config, NextResponse.json with ResponseInit) + this repo's own
// src/server/db/client.ts singleton convention.
import { NextResponse } from "next/server";
import { prisma } from "../../../src/server/db/client.js";

// Prisma's adapter-pg driver needs Node.js APIs (pg's TCP client) -- the edge
// runtime cannot run this. No explicit timeout per D-07: a slow-but-successful
// Neon cold-start wake must still report healthy.
export const runtime = "nodejs";
// Route Handlers are dynamic by default in Next.js 15+, but D-08 requires this
// explicitly and unconditionally, not by default-behavior inference.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json(
      { status: "ok" },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    // D-06: no stack trace, no connection string, no internal detail in the body.
    return NextResponse.json(
      { status: "error" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
```

### Anti-Patterns to Avoid
- **Adding a request timeout/`AbortController` race around the DB check:** D-07 explicitly forbids this — a genuine Neon cold-start wake (sub-second per Neon's docs, but not guaranteed instant) must be allowed to complete and report healthy, not be raced against an artificial timeout and falsely marked unhealthy.
- **Returning error details in the 503 body:** D-06 forbids leaking stack traces or connection info; catch broadly and return only `{status:"error"}`.
- **Relying on Next.js's default dynamic-rendering behavior alone for no-store:** Next 15+ does mark dynamic routes `private, no-cache, no-store` by default, but this project's D-08 wants that behavior to be an explicit, self-documenting guarantee (`dynamic = "force-dynamic"` plus an explicit `Cache-Control: no-store` response header) — not an inferred side effect that could silently regress on a future Next.js caching-default change.
- **Using Neon's pooled (`-pooler`) connection string for `DATABASE_URL`:** breaks `prisma migrate deploy` in `vercel-build` (see Common Pitfalls) — this is the single highest-risk mistake in this phase.
- **Running `npm install -g vercel` or adding `vercel` to `package.json`:** unnecessary; `npx vercel` works identically and keeps the CLI out of the project's dependency tree.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Deployment rollback | A custom "redeploy previous commit" script | `vercel rollback [deployment-id]` / `vercel promote [deployment-id]` | Vercel's Instant Rollback is a native alias-reassignment primitive with no rebuild — a hand-rolled redeploy-by-commit approach would re-run `vercel-build` (and thus re-run `prisma migrate deploy`), which is both slower and a real (if idempotent) DB-touching risk HEALTH-04 doesn't need to take |
| DB connectivity check | A custom TCP ping / raw `pg` client instantiated separately from the app | `prisma.$queryRaw\`SELECT 1\`` via the existing `prisma` singleton (`src/server/db/client.ts`) | Reuses the exact adapter/pool configuration the real app uses at runtime — a separate client would test a connection path the app doesn't actually use, producing false confidence |
| Env var presence verification | Screen-scraping the Vercel dashboard or storing secrets in a script to compare | `vercel env ls` (lists variable names/scopes, never prints values) | Native CLI command already does exactly this without ever exposing the secret value in logs |

**Key insight:** Every piece of this phase that looks like it needs custom tooling (rollback, health check, env audit) already has a first-class Vercel or Prisma primitive — the research risk here was confirming those primitives behave the way the plan needs (no rebuild on rollback, no timeout race on health check), not finding alternatives to them.

## Common Pitfalls

### Pitfall 1: Neon's pooled connection string breaks `prisma migrate deploy`
**What goes wrong:** `vercel-build`'s `prisma migrate deploy` step (via `scripts/migrate-if-production.mjs`) fails with a PgBouncer-related error (`prepared statement "s0" already exists`, or `Prisma Migrate does not support PgBouncer`) on the very first real production deploy.
**Why it happens:** Neon routes pooled connections (hostname containing `-pooler`) through PgBouncer in transaction mode, which does not support the named prepared statements Prisma's Schema/Migrate engine uses. This is confirmed as still true in Prisma 7 with driver adapters — the *adapter* config requirement was removed in v7, but the underlying PgBouncer limitation for Migrate was not. `[CITED: prisma.io/docs/guides/upgrade-prisma-orm/v7, neon.com/docs/connect/connection-errors]`
**How to avoid:** Use Neon's **direct/unpooled** connection string (hostname without `-pooler`) as the single `DATABASE_URL` value entered in Vercel's Production environment. Obtain it from the Neon Console's "Connection Details" panel with pooling toggled off (or explicitly select the non-pooled variant) — do not use the string Neon's Vercel marketplace integration auto-injects by default, since that integration defaults to the pooled string. `[CITED: neon.com/docs/changelog/2024-02-23]`
**Warning signs:** Build log shows a successful `prisma generate` and `next build`, but a red X on the `prisma migrate deploy` step with a Postgres error mentioning "prepared statement."

### Pitfall 2: Direct (unpooled) connections have a real, if generous, connection ceiling
**What goes wrong:** Using the direct connection string for both migration *and* runtime queries (this project's only option given the single-`DATABASE_URL` lock) means the app is bounded by Neon's `max_connections` for the compute size (roughly 100 on the smallest free-tier compute, up to thousands on larger computes), not PgBouncer's much higher pooled ceiling (~10,000).
**Why it happens:** No PgBouncer in the path means every serverless function invocation's `pg.Pool`/adapter connection counts directly against Postgres's own connection limit, not a proxy's.
**How to avoid:** At this project's traffic scale (portfolio demo, sporadic single-digit concurrent requests), this is very unlikely to be hit in practice. If it ever is, the escape hatch is adding a `DIRECT_URL` and reintroducing the pooled string for runtime only — but that is an explicit code change outside this phase's locked scope and should be flagged to the user rather than done silently.
**Warning signs:** Postgres error `FATAL: remaining connection slots are reserved` under concurrent load. `[CITED: neon.com/docs/connect/connection-pooling]`

### Pitfall 3: `vercel-build` script not actually invoked on first deploy
**What goes wrong:** Vercel's zero-config Next.js preset silently uses a different build command than expected, and the environment-gated migration never runs.
**Why it happens:** N/A in this case — verified this is *not* a real risk. Vercel's own docs confirm the `vercel-build` package.json script is the documented, standard override mechanism Vercel's build system looks for ahead of the plain `build` script, with no additional `vercel.json` configuration required. `[CITED: vercel.com/docs/functions/runtimes/node-js/advanced-node-configuration]`
**How to avoid:** No action needed beyond what Phase 14 already did. Confirm in the first real deploy's build log that the log explicitly shows `vercel-build` being run (not `next build` alone) as a sanity check.
**Warning signs:** Build log shows `next build` invoked directly without the `prisma generate`/migration lines preceding it.

### Pitfall 4: Prisma Client staleness from Vercel's dependency cache
**What goes wrong:** On a well-known class of Vercel+Prisma projects, `node_modules` caching between deploys means `prisma generate`'s `postinstall` hook doesn't re-run, leaving a stale generated client.
**Why it happens:** Vercel's build cache can skip `postinstall` if `package-lock.json` is unchanged.
**How to avoid:** This project is already double-protected: `postinstall` runs `prisma generate` *and* `vercel-build` explicitly runs `prisma generate` again as its first step regardless of cache state (Phase 14, verified). No action needed, but worth confirming in the first build log that `prisma generate` output actually appears (not skipped). `[CITED: prisma.io/docs/orm/more/help-and-troubleshooting/help-articles/vercel-caching-issue]`
**Warning signs:** Runtime error referencing a missing or outdated field on `generated/prisma/client.js`.

### Pitfall 5: Confusing "promote a preview deployment" with "roll back a production deployment"
**What goes wrong:** Assuming all `vercel promote`/`vercel rollback` invocations behave identically ("no rebuild"), when Vercel's docs describe two different code paths: promoting a **Preview** deployment to Production for the first time triggers a **full rebuild** with production env vars, while rolling back to a **previously-production** deployment (Instant Rollback) does **not** rebuild.
**Why it happens:** Both are exposed through similar-looking CLI commands (`vercel promote <id>`) but operate on deployments in different states.
**How to avoid:** For HEALTH-04, exercise the rollback specifically against a deployment that has **already served production traffic** (i.e., a prior `main`-branch auto-deploy), using `vercel rollback <previous-production-deployment-id>` — this is unambiguously the no-rebuild, alias-only Instant Rollback path. `[CITED: vercel.com/docs/instant-rollback, vercel.com/docs/deployments/promoting-a-deployment]`
**Warning signs:** A rollback/promote action that shows a new "Building..." status in `vercel inspect` output — that indicates the rebuild path was triggered, not Instant Rollback.

### Pitfall 6: Instant Rollback silently reverts env vars and cron state too
**What goes wrong:** After a rollback, the live deployment's environment variables/config reflect whatever was configured *at the time the rolled-back-to deployment was originally built*, not the project's current settings — potentially surprising if env vars changed in between.
**Why it happens:** Instant Rollback restores a previously-built artifact wholesale, including its embedded build-time env var snapshot.
**How to avoid:** Not a practical risk for this phase (env vars won't have changed between the trivial no-op commit and the rollback, all within one verification session), but document it in the rollback runbook so a future real incident-rollback isn't surprised by it. `[CITED: vercel.com/docs/instant-rollback]`
**Warning signs:** Post-rollback behavior referencing an env var value that was since intentionally changed in the dashboard.

### Pitfall 7: Overnight idle test conflates two independent cold-start mechanisms
**What goes wrong:** Treating "the app survived an overnight idle period" as a single pass/fail check on one system, when in fact two independent things must both recover correctly: Vercel's own serverless function cold start (the `/api/health` function itself hasn't been invoked in hours) and Neon's compute scale-to-zero suspend (the database compute has been idle).
**Why it happens:** Free-tier Neon computes auto-suspend after 5 minutes of inactivity by default (not configurable on free tier) — meaning the DB will *already* be suspended well before "overnight" is even reached; the overnight wait mainly proves Vercel's function-level cold start (much less frequent trigger) plus a *repeat* Neon wake, not a first-time-ever wake. `[CITED: neon.com/docs/connect/connection-latency]`
**How to avoid:** Frame HEALTH-03's verification precisely: wait a genuine multi-hour (ideally 8+ hour) period of zero traffic to the app, then issue a single `curl` against `/api/health`, and confirm a `200 {status:"ok"}` — accepting that elevated latency (Neon's own docs claim cold starts are typically sub-second, but real-world figures can be a few hundred ms to low seconds depending on region/plan) is expected and fine, only a timeout/error is a failure. `[CITED: neon.com/docs/get-started/dev-experience, neon.com/docs/guides/benchmarking-latency]`
**Warning signs:** A false "pass" recorded from a check run less than ~10-15 minutes after the last request (which would only prove Neon's already-fast steady-state wake, not a genuine extended idle scenario).

## Code Examples

### `/api/health` Route Handler (full pattern)
See "Pattern 1" above — this is the complete recommended implementation shape.

### Non-interactive Vercel CLI authentication and project linking
```bash
# Source: Context7 /websites/vercel (vercel.com/docs/cli/global-options,
# vercel.com/docs/projects/deploy-from-cli)
export VERCEL_TOKEN=<token-the-user-generates-in-Vercel-dashboard-Settings->Tokens>
npx vercel whoami --token "$VERCEL_TOKEN"
npx vercel link --yes --token "$VERCEL_TOKEN"   # writes .vercel/project.json (orgId, projectId)
```

### Auditing env vars without printing secret values
```bash
# Source: Context7 /websites/vercel (vercel.com/docs/cli/env)
npx vercel env ls --token "$VERCEL_TOKEN"
# Lists variable NAMES + target environments only -- never prints DATABASE_URL's value.
```

### Listing deployments and inspecting one
```bash
# Source: Context7 /websites/vercel (vercel.com/docs/cli)
npx vercel ls --token "$VERCEL_TOKEN"
npx vercel inspect <deployment-url-or-id> --token "$VERCEL_TOKEN"
```

### Rollback verification cycle (HEALTH-04)
```bash
# Source: Context7 /websites/vercel (vercel.com/docs/cli/rollback, vercel.com/docs/cli/promote)
# 1. Push a trivial, no-op commit (e.g. a comment/README touch) to main -> new prod deploy via CD-01's native Git integration.
# 2. Confirm the new deployment is READY:
npx vercel ls --token "$VERCEL_TOKEN"
# 3. Roll back to the prior production deployment (alias-only, no rebuild):
npx vercel rollback <previous-deployment-id> --token "$VERCEL_TOKEN"
# 4. Verify the live URL now serves the prior deployment's content/health status.
# 5. Restore forward state (undo the rollback):
npx vercel promote <newer-deployment-id> --token "$VERCEL_TOKEN"
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| Route Handler `GET` cached by default (Next.js <15) | `GET` Route Handlers are dynamic/uncached by default | Next.js 15.0.0-RC | This project is on Next 16.2.10, already past this change — `/api/health` is dynamic by default even without any explicit export, but D-08 is still implemented explicitly (`force-dynamic` + `Cache-Control: no-store`) for self-documenting certainty, not because it's strictly required to avoid caching |
| Prisma `adapter` key required in `prisma.config.ts` for driver adapters | `adapter` property removed from `prisma.config.ts` in Prisma ORM 7 — adapters configured purely via the runtime `new PrismaClient({ adapter })` call | Prisma ORM v7 | Already correctly reflected in this repo's `prisma.config.ts`/`client.ts` (Phase-14-locked, no change needed) |
| Neon Vercel integration injecting multiple `PG*` env vars | Defaults to injecting only `DATABASE_URL` | 2024-01-26 Neon changelog | Matches this project's single-env-var scope naturally, if the user opts into the integration at all (research recommends manual entry instead, see Pitfall 1) |

**Deprecated/outdated:**
- Older Prisma+PgBouncer guidance suggesting `?pgbouncer=true` query-string flag as a full workaround for Migrate: still relevant for Prisma Client query behavior, but does **not** fix `prisma migrate deploy`, which still requires a genuinely direct connection regardless of this flag.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Neon's free-tier direct/unpooled `max_connections` ceiling (~100) will not be hit by this portfolio project's actual traffic | Common Pitfalls #2 | Low — if wrong, symptom is an obvious, loud Postgres connection error under load; escape hatch (add `DIRECT_URL`, restore pooled runtime string) is well-documented and cheap to apply later, just requires a locked-scope exception |
| A2 | Vercel personal access tokens do not offer a granular "read-only vs. trigger-deploy" scope tier in the current dashboard UI — CONTEXT.md's D-04 scope distinction is a documented *usage* convention (which commands Claude actually runs), not an enforced *token* permission tier | Code Examples, Environment Availability | Low — if a granular scope tier does exist and isn't surfaced in general CLI/token docs, the practical effect is the same (full-account token, restrained by which commands are actually invoked); worth a quick dashboard glance by the user at token-creation time |
| A3 | Neon cold-start latency after a genuine multi-hour idle period remains in the sub-few-seconds range described in Neon's general docs, rather than degrading further with idle duration | Common Pitfalls #7 | Medium — if wrong, HEALTH-03's pass/fail framing ("expect elevated latency, not timeout") may need a longer curl timeout than assumed; Neon's docs describe steady-state cold-start behavior, not explicitly tested against "8+ hours idle" specifically |

## Open Questions

1. **Exact Neon compute size/plan the user will provision (free tier vs. paid Launch/Scale)**
   - What we know: Free tier auto-suspends after a fixed 5-minute inactivity window (not user-configurable); paid plans can adjust or disable auto-suspend entirely.
   - What's unclear: Which tier the user will actually select during their manual Neon sign-up (CONTEXT.md D-01/D-02) — this affects whether HEALTH-03's "genuine idle period" test is even meaningful (a paid plan with auto-suspend disabled would trivially "pass" without exercising any real cold-start path).
   - Recommendation: Planner should have the user confirm which Neon plan was selected as part of the provisioning checklist, and adjust HEALTH-03's verification framing accordingly (free tier = genuine cold-start test; paid-with-auto-suspend-disabled = document that no cold-start path exists to test, which is a legitimate but different outcome).

2. **Whether the user will create the Vercel/Neon projects via each platform's own dashboard independently, or via Vercel's "Add Integration -> Neon" marketplace flow (which auto-injects env vars)**
   - What we know: CONTEXT.md D-02 says the user does 100% manual entry; this research found the marketplace integration defaults to the *pooled* connection string, which would break `migrate deploy`.
   - What's unclear: Whether "manual entry" in D-02 already implicitly means "skip the marketplace integration, create Neon project independently, copy the direct string by hand" — or whether the user might still click the integration button for convenience and then just override the injected value.
   - Recommendation: The plan's provisioning checklist should say explicitly: create the Neon project directly on neon.tech (not via Vercel's marketplace/integrations tab), copy the **non-pooled** connection string from Neon's Connection Details panel, and paste it manually into Vercel's Production env var UI as `DATABASE_URL`. This removes the ambiguity regardless of which path CONTEXT.md's authors had in mind.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Vercel CLI (via `npx`) | All CLI verification steps (D-03/D-04, HEALTH-02/03/04) | ✓ | 56.4.0 | — |
| Node.js | Running `npx vercel`, local scripts | ✓ | matches `.nvmrc` (22) | — |
| Vercel account + `VERCEL_TOKEN` | All CLI verification | ✗ (does not exist yet — fresh sign-up, CONTEXT.md D-01) | — | User must generate the token during the phase's manual setup step before any CLI verification can run; no fallback, this blocks HEALTH-02/03/04 entirely until provided |
| Neon account + production database | DEPLOY-02, HEALTH-01/02/03 | ✗ (does not exist yet — fresh sign-up, CONTEXT.md D-01) | — | No fallback; blocks the entire phase until provisioned |
| Public GitHub repo + Vercel Git integration | CD-01 (already wired in Phase 14) | ✓ (repo already public per STATE.md; Vercel's own project import is the remaining manual step) | — | — |

**Missing dependencies with no fallback:**
- `VERCEL_TOKEN` (does not exist until the user generates it) — blocks all CLI-based verification steps.
- Neon production database connection string (does not exist until the user provisions it) — blocks DEPLOY-02 and everything downstream (HEALTH-01 through HEALTH-04).

**Missing dependencies with fallback:**
- None — both missing items above are hard blockers by design (CONTEXT.md D-01: neither account exists yet, and the user must be the one to create them).

## Security Domain

`security_enforcement` is not set in `.planning/config.json` (absent = enabled per default policy).

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-------------------|
| V2 Authentication | No | `/api/health` is intentionally unauthenticated (D-05/D-06 — public, no sensitive data returned); no user-facing auth surface is introduced in this phase |
| V3 Session Management | No | No session/cookie involved in this phase's code |
| V4 Access Control | No | No access-control decision is made by `/api/health` |
| V5 Input Validation | N/A | `/api/health` accepts no input (no query params, body, or headers consumed) — nothing to validate |
| V6 Cryptography | Partial | TLS is handled entirely by Vercel (HTTPS termination) and Neon (`sslmode=require`, appended automatically by Neon's own connection-string generator) — no cryptography is hand-rolled in this phase |

### Known Threat Patterns for this phase's stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|----------------------|
| Information disclosure via verbose health-check errors (stack traces, connection strings, DB error text leaked in a 503 body) | Information Disclosure | D-06 already locks the response shape to `{status:"error"}` with no detail; implement the `catch` block to discard the actual error object entirely, never interpolate it into the response |
| Secret leakage of `DATABASE_URL` or `VERCEL_TOKEN` in logs/commits | Information Disclosure | Never `console.log` or commit either value; use `vercel env ls` (names only) for auditing; `VERCEL_TOKEN` should be exported as a shell env var for the verification session, never written to a tracked file |
| Cached health-check response masking a real outage (stale `200 ok` served from an edge/browser cache during an actual DB incident) | Tampering / Denial of Service (in the "false confidence" sense) | D-08's `no-store` + `force-dynamic` combination, verified explicitly in code rather than relying on framework-default inference |
| Over-privileged Vercel CLI token used carelessly (e.g., accidentally running a destructive command against the wrong project) | Elevation of Privilege | Personal Vercel tokens do not have fine-grained per-command scoping (see Assumption A2); mitigate by scoping usage narrowly in the plan itself (which specific commands are run, in which order) rather than relying on the token's own permission tier, and by confirming the linked project (`vercel link`, `.vercel/project.json`) matches the intended project before any promote/rollback action |

## Sources

### Primary (HIGH confidence)
- Context7 `/websites/vercel` — CLI global options/auth (`VERCEL_TOKEN`, `--token`), `vercel link`, `vercel deploy`, `vercel rollback`, `vercel promote`, `vercel env`, Instant Rollback semantics, `vercel-build` script detection, function runtime/duration limits
- Context7 `/websites/neon` — connection pooling (pooled vs. direct), scale-to-zero/cold-start latency, Vercel integration env var defaults and changelog history
- Context7 `/llmstxt/prisma_io_llms_txt` and `/prisma/prisma` — Prisma 7 driver adapter config changes, PgBouncer/Migrate limitation, `directUrl` workaround pattern
- Context7 `/vercel/next.js` — Route Handler dynamic/caching defaults (Next 15+ change), `runtime` segment config, `NextResponse.json` with `ResponseInit`/headers
- This repository — `src/server/db/client.ts`, `app/api/trpc/[trpc]/route.ts`, `.env.example`, `package.json`, `prisma.config.ts`, `.planning/phases/14-pipeline-hooks/14-04-SUMMARY.md`, `README.md` (all read directly, HIGH confidence as ground truth for current locked state)
- Direct tool verification in this environment: `npm view vercel version` -> `56.4.0`; `npx vercel --version` -> `Vercel CLI 56.4.0` (matches); `slopcheck install vercel` -> `[OK]` on npm registry

### Secondary (MEDIUM confidence)
- WebSearch cross-referencing Prisma+Neon+PgBouncer prepared-statement error reports (GitHub issues #6480, #20612), verified against and consistent with the primary Prisma/Neon doc sources above
- WebSearch on Vercel+Prisma build-cache/`postinstall` staleness pattern — consistent with, and already mitigated by, this project's existing Phase 14 double-`prisma generate` setup

### Tertiary (LOW confidence)
- None retained as unverified — every WebSearch finding used in this document was cross-checked against an official Context7-sourced doc page before inclusion.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages, all tooling (Vercel CLI, Neon, Next.js, Prisma) already version-confirmed either in this repo or via live registry/CLI check
- Architecture: HIGH — the connection-string finding and rollback-mechanics finding are both confirmed by multiple independent official-doc sources, not training-data guesses
- Pitfalls: HIGH for Pitfalls 1, 3, 4, 5, 6 (directly sourced from official docs); MEDIUM for Pitfalls 2 and 7 (directionally correct per official docs, but exact real-world numbers for this specific project's traffic/region are not independently benchmarked in this research session)

**Research date:** 2026-07-20
**Valid until:** 30 days (Vercel CLI and Neon connection-pooling behavior are both fast-moving; re-verify `npx vercel --version` and Neon's current default connection-string behavior at execution time if this research is more than a few weeks old)
