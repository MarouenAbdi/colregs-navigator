---
phase: 15-deploy-verify
plan: 04
subsystem: infra
tags: [vercel, rollback, promote, health-check, deployment]

requires:
  - phase: 15-deploy-verify
    plan: "03"
    provides: "Live production deployment on Vercel, confirmed reachable via CLI and a real external request"
provides:
  - "Live-exercised HEALTH-04 rollback/promote cycle against real deployment IDs, plus README.md's Rollback Procedure subsection documenting the verified commands"
affects: [15-05]

tech-stack:
  added: []
  patterns:
    - "Vercel Instant Rollback verification: capture the pre-change deployment ID, ship the change via a normal merge (creating a new deployment), rollback to the prior ID, confirm via vercel inspect timestamps that no rebuild occurred, then promote forward again -- proves the mechanism live without leaving production on a stale deployment"

key-files:
  created: []
  modified: [README.md]

key-decisions:
  - "Committed the rollback runbook via PR #21 (reviewed and merged by the user) instead of a direct git push to main, per the user's explicit preference set earlier in this phase for a PR-review flow on all main-bound changes."

patterns-established: []

requirements-completed: [HEALTH-04]

duration: unspecified
completed: 2026-07-21
---

# Plan 15-04: Live Rollback/Promote Exercise + README Runbook

## Objective

Live-exercise HEALTH-04's rollback path and document the runbook in README.md.

## What happened

**Deviation from the plan's literal instructions:** the plan's Task 1 called for committing
the rollback runbook directly to `main` via `git push`. Per the user's explicit preference
(set earlier in this phase), this repo uses a PR-review flow for all `main`-bound changes
instead -- so the runbook commit went through PR #21 (`docs(15): document verified rollback
procedure`), reviewed and merged by the user, rather than a direct push. Everything else in
this plan (capturing deployment IDs, the live rollback/promote cycle) proceeded as designed.

1. **Deployment A captured** (pre-runbook production deployment, before any change):
   `colregs-navigator-3dcrolkmf-marouenabdi95-5583s-projects.vercel.app`
   (`dpl_5HNCwJwaD1yEamjEffx9crD28zhN`).
2. **README.md** updated with a `### Rollback Procedure` subsection documenting
   `vercel rollback` / `vercel promote` semantics (alias-only, no rebuild, no migration
   re-run) and the env-var-snapshot caveat. Merged to `main` via PR #21.
3. **Deployment B created** by that merge: Vercel's native Git integration built and deployed
   it automatically. Confirmed Ready and aliased to production:
   `colregs-navigator-m3i1z6gj1-marouenabdi95-5583s-projects.vercel.app`
   (`dpl_ET1LKwBASsLg1uddg3QuZRpeUQW1`).
4. **Live rollback executed:** `npx vercel rollback <deployment-A> --token "$VERCEL_TOKEN" --yes`
   succeeded. `vercel inspect` confirmed deployment A's `created` timestamp was unchanged
   (12 minutes old at inspection time -- no new build triggered). `curl` against the production
   alias's `/api/health` returned `200 {"status":"ok"}` immediately after.
5. **Live promote executed:** `npx vercel promote <deployment-B> --token "$VERCEL_TOKEN" --yes`
   succeeded, reassigning the production alias back to deployment B. Confirmed via
   `vercel inspect colregs-navigator-kappa.vercel.app` (resolves to deployment B's ID) and a
   final `/api/health` curl returning `200 {"status":"ok"}`.

## Verification

- `vercel rollback` and `vercel promote` both completed in ~2-3s each -- consistent with
  Vercel's Instant Rollback being an alias reassignment only, never a rebuild.
- No new "Building" state observed at either step; `vercel inspect` timestamps confirmed this
  directly for the rollback target.
- `/api/health` returned `200 {"status":"ok"}` after both the rollback and the promote,
  confirming the app (and its DB-connectivity check) functions identically regardless of
  which of the two deployments serves production traffic.
- Production alias ended in its intended final state: deployment B (containing the
  documented rollback runbook).

## Security note

One `npx vercel rollback` invocation was initially blocked by the auto-mode permission
classifier as a production-mutating action. The user was asked directly and explicitly
approved before the command was retried and executed successfully.

## Requirements satisfied

HEALTH-04 -- confirmed with a real, live-exercised rollback -> restore cycle (not just a
documented mechanism). README.md's Rollback Procedure subsection accurately describes the
exact commands used.
