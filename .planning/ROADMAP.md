# Roadmap: COLREGS Navigator

## Milestones

- ✅ **v1.0** (2026-07-14 → 2026-07-18) — Domain foundations, COLREGS rules engine, persistence/API layer, interactive chart sandbox, save/share/gallery. 5 phases, 19 plans. See `.planning/milestones/v1.0-ROADMAP.md`.
- ✅ **v1.1 UI Redesign (shadcn)** (2026-07-18 → 2026-07-19) — Re-implemented the entire front end against an imported Claude Design file using shadcn/ui, dark-mode only, across 4 branch+PR phases (Scaffolding, Hero, Sandbox, Gallery). Zero change to domain logic or existing validated requirements. 4 phases, 14 plans, 19/19 requirements validated. See `.planning/milestones/v1.1-ROADMAP.md`.
- ✅ **v1.2 Tech Debt & Stabilization** (2026-07-19 → 2026-07-20) — ESLint tooling, deprecated Tailwind v4 class-name fixes, ChartPanel/SandboxContainer decomposition refactor, and comment-convention cleanup. No new user-facing features; zero change to domain logic outcomes. 4 phases, 18 plans, 22/22 requirements validated. See `.planning/milestones/v1.2-ROADMAP.md`.
- 🚧 **v1.3 CI/CD & Deployment** (started 2026-07-20) — GitHub Actions CI/CD pipeline, Husky/lint-staged pre-commit hooks, CONTRIBUTING.md, and a live Vercel + Neon production deployment with go-live verification. 2 phases (14-15), 17/17 requirements mapped.

## Phases

<details>
<summary>✅ v1.0 (Phases 1-5) — SHIPPED 2026-07-18</summary>

- [x] Phase 1-5 — see `.planning/milestones/v1.0-ROADMAP.md` for full phase details

</details>

<details>
<summary>✅ v1.1 UI Redesign (shadcn) (Phases 6-9) — SHIPPED 2026-07-19</summary>

- [x] Phase 6: Scaffolding — shadcn/ui install + Tailwind dark theme tokens + Header/Nav + page shell (completed 2026-07-18)
- [x] Phase 7: Hero — Direction A hero section (headline, copy, CTAs, illustrative live-classification preview card) (completed 2026-07-18)
- [x] Phase 8: Sandbox — Restyled interactive chart/controls/reasoning-trail to match the design, same domain wiring (completed 2026-07-18)
- [x] Phase 9: Gallery — Gallery section embedded on the home page below Sandbox; `/gallery` route removed with a redirect to `/#gallery` (completed 2026-07-19)

See `.planning/milestones/v1.1-ROADMAP.md` for full phase details (goals, success criteria, plans).

</details>

<details>
<summary>✅ v1.2 Tech Debt & Stabilization (Phases 10-13) — SHIPPED 2026-07-20</summary>

- [x] Phase 10: ESLint Setup & Lint-Clean Baseline — Install ESLint (flat config), wire `npm run lint`, and reach a lint-clean baseline with architecture-boundary and convention-enforcing custom rules (completed 2026-07-19)
- [x] Phase 11: Tailwind Deprecated Class-Name Fixes — Replace deprecated Tailwind v3 class names with v4 canonical equivalents in the 6 flagged files, verified by hand (completed 2026-07-19)
- [x] Phase 12: ChartPanel/SandboxContainer Decomposition Refactor — Decompose the two oversized Sandbox files into focused modules, preserving all existing behavior and hit-testing (completed 2026-07-20)
- [x] Phase 13: Comment Cleanup — Rewrite stale Phase/Plan/REQ-ID comment references by hand, preserving substantive WHY content (completed 2026-07-20)

See `.planning/milestones/v1.2-ROADMAP.md` for full phase details (goals, success criteria, plans).

</details>

### 🚧 v1.3 CI/CD & Deployment (In Progress)

**Milestone Goal:** Demonstrate basic, portfolio-credible full-stack DevOps competency — a GitHub Actions CI/CD pipeline and a real, live-deployed instance of the app with a production Postgres database.

- [ ] **Phase 14: Pipeline & Hooks** - GitHub Actions CI/CD pipeline (lint/typecheck/test/build gate + auto-deploy wiring), Husky/lint-staged pre-commit hooks, and CONTRIBUTING.md
- [ ] **Phase 15: Deploy & Verify** - Live Vercel + Neon production deployment, provisioned and go-live-verified end-to-end

## Phase Details

### Phase 14: Pipeline & Hooks

**Goal**: Every PR is gated by a real, required GitHub Actions CI pipeline (lint, typecheck, test against real Postgres, build); the production deploy path (Prisma generate → environment-gated migrate deploy → webpack build) is fully authored and wired though not yet exercised against real hosting; local commits are guarded by a fast pre-commit hook; and contributor documentation reflects real, not aspirational, tooling behavior.
**Depends on**: Phase 13 (last completed phase; no code dependency — this is the first phase of v1.3)
**Requirements**: CI-01, CI-02, CI-03, CI-04, CI-05, CI-06, CD-01, CD-02, HOOKS-01, DOCS-CONTRIB-01
**Success Criteria** (what must be TRUE):

  1. Opening a PR with a lint, typecheck, test, or build failure shows a red required status check that blocks merging into `main` (CI-01, CI-05)
  2. The CI test job runs against a real Postgres instance by reusing the existing `docker-compose.yml` config, with no separate/duplicated DB service definition (CI-02)
  3. A fresh clone followed by `npm ci` succeeds without any manual `prisma generate` step, and local dev, CI, and the deploy script all resolve the same Node version from a committed `.nvmrc` (CI-03, CI-04)
  4. README displays a live, accurate GitHub Actions CI status badge (CI-06)
  5. Committing a staged file with a lint violation triggers Husky + lint-staged to auto-fix it before the commit completes, while the full typecheck/test suite runs in CI only, not pre-commit (HOOKS-01)
  6. `CONTRIBUTING.md` documents setup, running checks locally, the real (not aspirational) pre-commit hook behavior, branch/commit conventions, PR expectations, and a rollback note (DOCS-CONTRIB-01)
  7. The deploy script/workflow is fully authored — Prisma client generation, an environment-gated `prisma migrate deploy` (production builds only, never PR previews), and the mandatory `next build --webpack` flag — and ready to execute the moment a real host is provisioned in Phase 15 (CD-01, CD-02 wiring; live verification deferred to Phase 15)

**Plans**: 4 plans
Plans:
**Wave 1**

- [x] 14-01-PLAN.md — CI pipeline foundation (.nvmrc, postinstall prisma generate, ci.yml with lint/typecheck/test/build jobs reusing docker-compose.yml, README CI badge)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 14-02-PLAN.md — Trigger a real CI run against a live PR; branch protection decision + configuration for CI-05
- [x] 14-03-PLAN.md — Husky + lint-staged pre-commit hooks (staged eslint --fix, .env* guard) and CONTRIBUTING.md

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 14-04-PLAN.md — Environment-gated vercel-build deploy script (prisma generate -> gated migrate deploy -> next build --webpack), locally verified

### Phase 15: Deploy & Verify

**Goal**: The app is live on a real, publicly-reachable Vercel URL backed by a provisioned production Neon Postgres database, with every `.env.example` variable configured in production, and the deployment is verified end-to-end — including surviving a real post-idle-period request — with a working, documented rollback path.
**Depends on**: Phase 14 (CI pipeline must be green and the deploy script must already be authored/wired before the first real deploy is attempted)
**Requirements**: DEPLOY-01, DEPLOY-02, DEPLOY-03, HEALTH-01, HEALTH-02, HEALTH-03, HEALTH-04
**Success Criteria** (what must be TRUE):

  1. The app is reachable at a real, public Vercel production URL (DEPLOY-01)
  2. Production Postgres (Neon) is provisioned and wired to the app via Phase 14's deploy script, with migrations applied against it (DEPLOY-02, exercises CD-01/CD-02 live for the first time)
  3. Every environment variable listed in `.env.example` is configured in Vercel's production environment, confirmed by a successful production build and runtime (DEPLOY-03)
  4. `/api/health` performs a real database connectivity check and returns a meaningful, accurate status (HEALTH-01)
  5. A real end-to-end request against the live deployment succeeds — not just a green build log (HEALTH-02)
  6. The live deployment is verified to survive a request after a genuine overnight idle period, with no cold-start or DB-suspend failure (HEALTH-03)
  7. A documented rollback procedure (the host's one-click "promote a previous deployment") exists and is confirmed to work (HEALTH-04)

**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 10 → 11 → 12 → 13 → 14 → 15

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-5 | v1.0 | 19/19 | Complete | 2026-07-18 |
| 6. Scaffolding | v1.1 | 2/2 | Complete | 2026-07-18 |
| 7. Hero | v1.1 | 2/2 | Complete | 2026-07-18 |
| 8. Sandbox | v1.1 | 6/6 | Complete | 2026-07-18 |
| 9. Gallery | v1.1 | 4/4 | Complete | 2026-07-19 |
| 10. ESLint Setup & Lint-Clean Baseline | v1.2 | 3/3 | Complete    | 2026-07-19 |
| 11. Tailwind Deprecated Class-Name Fixes | v1.2 | 3/3 | Complete    | 2026-07-20 |
| 12. ChartPanel/SandboxContainer Decomposition Refactor | v1.2 | 4/4 | Complete   | 2026-07-20 |
| 13. Comment Cleanup | v1.2 | 8/8 | Complete | 2026-07-20 |
| 14. Pipeline & Hooks | v1.3 | 4/4 | Complete | 2026-07-20 |
| 15. Deploy & Verify | v1.3 | 0/TBD | Not started | - |
</content>
