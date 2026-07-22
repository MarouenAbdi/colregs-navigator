# Phase 15 (Deploy & Verify) — Verification

**Verified:** 2026-07-22 (performed retroactively, as part of the v1.3 milestone audit — no
phase-level verification had been run at the time each plan completed; this report aggregates
the strong per-plan evidence already on record in 15-01/15-03/15-04/15-05-SUMMARY.md and adds
independent cross-checks against live repo/GitHub/Vercel state performed by the milestone
audit's integration checker, rather than trusting SUMMARY.md self-reports alone.)

**Overall verdict: PASS** — all 7 ROADMAP.md success criteria confirmed true. Two documentation
inconsistencies were found during the milestone audit (README.md self-contradicting on
live-deployment status; CONTRIBUTING.md's Rollback section never superseded as it promised) and
have been fixed as part of closing this verification gap — see Gaps Found below.

## Success Criteria

| # | Criterion | Requirements | Verdict | Evidence |
|---|-----------|---------------|---------|----------|
| 1 | App reachable at a real, public Vercel production URL | DEPLOY-01 | **PASS** | `15-03-SUMMARY.md`: confirmed via Vercel CLI (`vercel inspect`) that the production deployment is Ready and aliased to `colregs-navigator-kappa.vercel.app`. Independently re-confirmed by the audit's integration checker via direct file/config inspection. |
| 2 | Production Postgres (Neon) provisioned and wired via Phase 14's deploy script, migrations applied | DEPLOY-02 | **PASS** | `15-02` (manual Neon+Vercel provisioning) → `15-03-SUMMARY.md`: live Vercel build log shows `prisma generate` → `migrate-if-production.mjs` running `prisma migrate deploy` against the real Neon host reporting "no pending migrations" → `next build --webpack`, zero PgBouncer/prepared-statement errors (confirms the direct/unpooled connection string was used, not the pooled one that would break `migrate deploy`). Integration checker independently confirmed zero drift between Phase 14's authored script and what actually ran live (`git log` across the verification-to-HEAD range touching `package.json`/`scripts/`/`prisma/` returns no commits). |
| 3 | Every `.env.example` variable configured in Vercel's production environment | DEPLOY-03 | **PASS** | `15-02`/`15-03`: `.env.example`'s sole variable, `DATABASE_URL`, was added to Vercel's Production environment using the Neon direct connection string; confirmed by the successful production build and runtime above. |
| 4 | `/api/health` performs a real DB connectivity check, returns meaningful/accurate status | HEALTH-01 | **PASS** | `15-01-SUMMARY.md`: `app/api/health/route.ts` runs a real `SELECT 1` through the app's existing Prisma singleton, locally verified in both 200 (healthy) and 503 (DB-down) branches. `15-03-SUMMARY.md`: same behavior confirmed live against the production Neon database. |
| 5 | Live deployment verified end-to-end with a real request | HEALTH-02 | **PASS** | `15-03-SUMMARY.md`: real external `curl` against `https://colregs-navigator-kappa.vercel.app/api/health` returned `200 {"status":"ok"}` with `Cache-Control: no-store`. |
| 6 | Live deployment survives a request after a genuine post-idle period | HEALTH-03 | **PASS** | `15-05-SUMMARY.md`: after a genuine ~18.5h zero-traffic idle window (T0 = 13:42 UTC 2026-07-21, checked 08:11 UTC 2026-07-22), `/api/health` returned `200 {"status":"ok"}` in `2.875084s` — elevated latency consistent with a Vercel cold start + Neon free-tier compute wake, not a failure. |
| 7 | Documented rollback procedure exists and is confirmed to work | HEALTH-04 | **PASS** | `15-04-SUMMARY.md`: real `vercel rollback <deployment-A>` → `vercel promote <deployment-B>` cycle executed against real deployment IDs; `vercel inspect` confirmed no rebuild was triggered at either step; `/api/health` returned 200 after both actions. README.md's Rollback Procedure subsection documents the exact commands used. |

## Requirements Coverage

DEPLOY-01, DEPLOY-02, DEPLOY-03, HEALTH-01, HEALTH-02, HEALTH-03, HEALTH-04 — all **satisfied**,
none deferred.

## Gaps Found (identified and closed during the v1.3 milestone audit)

1. **README.md self-contradicted** on live-deployment status: the Local Setup section still
   claimed "There is no hosted/live deployment for this milestone" while the Deployment section
   (written later, in `15-03`) correctly stated the app is live. **Fixed** — the stale sentence
   in Local Setup was removed and replaced with a pointer to the Deployment section.
2. **CONTRIBUTING.md's Rollback section was stale**: it explicitly said it would be "superseded"
   once a live deployment with real rollback tooling existed (which `15-04` delivered), but was
   never updated. **Fixed** — the section now documents both the production rollback path
   (pointing at README.md's live-verified procedure) and the `git revert` path for bad merge
   commits.
3. **15-04-SUMMARY.md was missing its YAML frontmatter block** (unlike its siblings 15-01/15-03/
   15-05), so the milestone audit's automated `requirements-completed` extraction could not find
   HEALTH-04 — even though the plan's own frontmatter and the summary's narrative both clearly
   documented the live rollback exercise. **Fixed** — frontmatter backfilled with
   `requirements-completed: [HEALTH-04]`.

None of these were functional gaps — the live deployment, migrations, health check, and rollback
mechanism were all independently re-confirmed working. They were documentation/traceability gaps
that a phase-level verification would normally have caught at the time.

## Tech Debt (non-blocking, carried forward)

- `/api/health` has no automated CI regression coverage — `vitest.config.ts` only globs
  `src/**/*.test.{ts,tsx}`, and the health route lives at `app/api/health/route.ts`, outside that
  glob. Verified only manually to date. A future regression in the health check's DB query, error
  handling, or caching headers could ship silently through a green CI pipeline.
- A spurious empty Vercel project (`agent-a5473b04789dea3ed`), created by a `vercel link`
  directory-basename mis-detection during `15-03`, was never deleted (`vercel project rm` was
  blocked by this environment's destructive-action policy). Harmless — no deployments — but should
  be removed via the Vercel dashboard at the user's convenience.

## Phase Goal Achievement

Phase 15's stated goal — a live, publicly-reachable Vercel deployment backed by a provisioned
Neon production database, verified end-to-end including a real post-idle-period request, with a
working documented rollback path — is genuinely achieved. Every success criterion was checked
against actual per-plan evidence and, where possible, independently re-confirmed against live
repo/GitHub state rather than only trusting prior SUMMARY.md claims. The v1.3 milestone is ready
to close.
