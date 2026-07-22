# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.1 — UI Redesign (shadcn)

**Shipped:** 2026-07-19
**Phases:** 4 | **Plans:** 14 | **Timeline:** 2026-07-18 → 2026-07-19 (2 days, 166 commits, 215 files changed)

### What Was Built
- shadcn/ui installed as the component-primitive layer (Radix base), a single locked dark-token palette, Geist/Geist Mono fonts, and a sticky Header/Footer page shell wired app-wide (Phase 6: Scaffolding)
- A net-new Hero section with a fully static SVG "live classification" preview card whose readouts are computed by a real `classifyEncounter()`/`bearing()`/`cpa()` call against a fixed, verified fixture — not hand-authored numbers (Phase 7: Hero)
- The existing interactive chart, controls, and reasoning trail restyled to the dark theme with shadcn/Radix primitives (Select, Slider, Card, Badge), zero regression to drag/rotate hit-testing or classification behavior (Phase 8: Sandbox)
- The curated encounter gallery embedded as a home-page section (6-card responsive grid) with a parametrized mini-chart component shared with Hero's SVG geometry; the standalone `/gallery` route removed in favor of a permanent `/#gallery` redirect (Phase 9: Gallery)

### What Worked
- Following the established Phase 7 conventions (split computation from presentation, no duplicated JSX, no raw CSS-as-strings, WHY-only comments) held up cleanly across Phases 8-9 with no rework needed to enforce them retroactively.
- Extracting shared logic on the second real consumer, not speculatively — `static-chart-geometry.ts` (Hero → Gallery) and `vessel-role.ts` (Sandbox's three restyled cards) both followed this rule and avoided premature abstraction.
- Mandatory manual browser UAT checkpoints caught real regressions invisible to jsdom in every phase that had one: Phase 8's hit-testing dead zone (a decorative badge silently blocking hull-drag pointer events) and Phase 9's redirect/anchor-scroll behavior both required a real browser to observe.
- Pulling the live Claude Design source (not just a static screenshot) mid-task, when precision mattered, resolved real pixel-value discrepancies (Header height/gap/background) that a screenshot-only audit had missed — this became a reusable lesson, not a one-off fix.

### What Was Inefficient
- REQUIREMENTS.md's checkboxes for HERO-01–04 and SBOX-01/03 were never updated when Phases 7 and 8 closed, even though both phases' own VERIFICATION.md reports confirmed those requirements complete. The gap went unnoticed until this milestone-close audit cross-checked the traceability table against phase verification evidence — a mechanical step that should happen at every phase close, not just at milestone close.
- Phase 8's Sandbox restyle needed 11 rounds of styling/layout-drift fixes during a single UAT session before reaching sign-off, the highest churn of any phase this milestone — restyling three cards' worth of markup against a design source that was itself updated mid-session compounded the number of passes needed.
- The original Key Decisions table carried "— Pending" placeholder outcomes for six v1.0 strategic decisions that were never resolved at v1.0's own milestone close — they sat unresolved through an entire subsequent milestone until this v1.1 close caught and fixed them too.

### Patterns Established
- Cross-check REQUIREMENTS.md's traceability table against each phase's VERIFICATION.md at phase close, not just at milestone close — stale checkboxes are cheap to introduce and easy to miss until an external audit looks for them.
- When a design-fidelity task's precision matters and only a screenshot reference is on hand, pull the live design source (e.g. via the design tool's MCP) before trusting pixel-level values from the screenshot alone.
- Decorative SVG overlays stacked on top of an interactive/draggable shape must get `pointer-events: none` explicitly — this project's second independent instance of the same hit-testing regression class (first in Phase 4, again in Phase 8) confirms it's a recurring risk, not a one-off bug.

### Key Lessons
1. A phase's own SUMMARY.md/VERIFICATION.md being internally correct doesn't guarantee the milestone-level REQUIREMENTS.md traceability table gets updated to match — treat that sync as a required phase-close step, not an implicit side effect.
2. Manual browser UAT is non-negotiable for any change touching SVG hit-testing, drag/rotate gestures, or anchor-scroll/redirect behavior — jsdom cannot observe any of these, and this milestone's two UAT checkpoints each found a real bug that automated tests missed.
3. Resolve Key Decisions table "Pending" placeholders at milestone close, not just at the decision's origin — otherwise they silently roll forward unresolved across milestone boundaries.

### Cost Observations
- Model mix: not tracked this milestone.
- Sessions: not tracked this milestone.
- Notable: 4 phases / 14 plans shipped in 2 days (166 commits, 215 files changed) — the fastest of the two milestones so far, likely aided by the design source (Claude Design file) removing most visual-direction ambiguity up front.

---

## Milestone: v1.3 — CI/CD & Deployment

**Shipped:** 2026-07-22
**Phases:** 2 | **Plans:** 9 | **Timeline:** 2026-07-20 → 2026-07-22 (3 days)

### What Was Built
- A required GitHub Actions CI pipeline (lint, typecheck, test against real Postgres via the existing `docker-compose.yml`, build) proved against a live PR, with branch protection enforced on `main` after making the repo public (Phase 14)
- Husky + lint-staged pre-commit hooks (staged-file `eslint --fix` + `.env*` commit guard) and a `CONTRIBUTING.md` documenting the actually-verified hook/setup/CI behavior (Phase 14)
- An environment-gated `vercel-build` script (`prisma generate` → gate on `VERCEL_ENV === 'production'` → `next build --webpack`), authored and locally verified in both gate states (Phase 14)
- A public `/api/health` Route Handler running a real `SELECT 1` through the app's Prisma singleton, and a live Vercel + Neon Postgres production deployment confirmed via CLI (not dashboard screenshots) to be built by the exact locked deploy script (Phase 15)
- A live-exercised rollback/promote cycle against real Vercel deployment IDs, and HEALTH-03 (survival after a genuine ~18.5h idle window) confirmed via a real external HTTP request (Phase 15)

### What Worked
- Live-exercising the CI pipeline against a real PR (not just authoring `ci.yml` and trusting it) surfaced three real bugs — a peer-dep drift, a missing `prisma db seed` step, and a TypeScript-preview/Next.js build-time incompatibility — none of which would have been caught by local dry-runs alone.
- Verifying every deploy claim via CLI output (`vercel inspect`, `vercel ls`, `gh api` branch protection) rather than dashboard screenshots or self-reported success made the milestone audit's independent re-verification straightforward — the evidence was already machine-checkable.
- Splitting the milestone into exactly 2 phases (repo-local tooling vs. real hosting/DB provisioning), compressed down from research's suggested 4, kept each phase's blast radius clean: Phase 14 had zero external dependency, Phase 15 was pure live-infrastructure verification.

### What Was Inefficient
- `/api/health` shipped with zero automated CI regression coverage — `vitest.config.ts` only globs `src/**/*.test.{ts,tsx}`, and the route lives under `app/api/health/`, outside that glob. The gap wasn't caught until the milestone audit, and remains open tech debt.
- Plan 15-02 (manual Neon+Vercel provisioning) never produced its own SUMMARY.md, since it was a human-executed checklist rather than an agent-executed plan — its completion was only confirmed indirectly through Plan 15-03's SUMMARY.md and the milestone audit, which briefly showed up as a false "89% progress" reading in automated roadmap analysis.
- A `vercel link --yes` project-name auto-detection bug created a spurious empty Vercel project from the worktree's directory basename instead of the real project — caught immediately by the plan's own stated mitigation (cross-checking `.vercel/project.json` against `vercel project ls`), but the empty project itself couldn't be deleted (blocked by this environment's destructive-action policy) and had to be left for manual cleanup.
- The pre-close artifact audit tool (`gsd-sdk query audit-open`) flagged all 4 completed quick tasks as "missing" — a tool bug (`scanQuickTasks` looks for a literal `SUMMARY.md` filename, but this repo's convention is `{quick_id}-SUMMARY.md`), not a real gap. Required manual cross-checking each quick task's actual SUMMARY.md frontmatter before proceeding with milestone close.

### Patterns Established
- Verify infrastructure/deploy claims via CLI output or live HTTP requests, never dashboard screenshots or self-reported "it worked" — every DEPLOY-*/HEALTH-* requirement in this milestone was closed with reproducible command output, which is what made the milestone audit fast and conclusive.
- A manual/human-executed plan (no agent, no SUMMARY.md) is legitimate when the step requires real external account credentials or dashboard actions the agent can't perform — but its completion must be confirmed by a *later* plan's or VERIFICATION.md's independent evidence, not just trusted.

### Key Lessons
1. Authoring a CI/CD script and exercising it against real infrastructure are different milestones of confidence — this project's Phase 14 (author) → Phase 15 (exercise) split caught 3 CI bugs and one Vercel-linking bug that authoring alone would never have surfaced.
2. When a route or module sits outside the test runner's configured glob, it silently has zero coverage even if tests exist elsewhere in the codebase — worth a periodic `vitest.config.ts` glob audit against the app's actual directory layout (`app/api/**` in this case), not just `src/**`.
3. Tooling that scans for artifact-completion status (audit scripts, CI checks) can itself drift out of sync with a project's actual naming conventions — a "missing" or "failing" signal from automation is worth a quick manual cross-check before treating it as a real gap, especially right before an irreversible action like milestone close.

### Cost Observations
- Model mix: not tracked this milestone.
- Sessions: not tracked this milestone.
- Notable: 2 phases / 9 plans shipped in 3 days — the shortest milestone by phase count so far, but with real external-infrastructure risk (Vercel/Neon provisioning, live rollback exercise, an overnight idle-window wait) that the three prior all-internal milestones didn't carry.

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | - | 5 | Established domain-first architecture (rules engine before UI); no retrospective captured at close |
| v1.1 | - | 4 | First milestone with a `RETROSPECTIVE.md`; introduced the "extract on second real consumer" and "WHY-only comments" conventions during Phase 7, applied through Phase 9 |
| v1.2 | - | 4 | Tech-debt/hygiene milestone (no retrospective section captured at close — gap, not repeated in v1.3); ESLint lint-clean baseline, Tailwind v4 fixes, Sandbox decomposition, comment cleanup |
| v1.3 | - | 2 | First milestone verified against live external infrastructure (real CI runs, real Vercel/Neon deploy, live rollback exercise) rather than local-only simulation |

### Cumulative Quality

| Milestone | Tests | Coverage | Zero-Dep Additions |
|-----------|-------|----------|-------------------|
| v1.0 | - | - | - |
| v1.1 | 196/196 passing (32 files, end of Phase 8) | not tracked | shadcn/ui, Radix primitives (already-planned dependency, not zero-dep) |
| v1.2 | 216/216 passing throughout | not tracked | ESLint + custom rules (dev-only tooling, not runtime deps) |
| v1.3 | 216/216 passing throughout (zero domain/test changes) | not tracked | Husky, lint-staged (dev-only pre-commit tooling, not runtime deps) |

### Top Lessons (Verified Across Milestones)

1. SVG hit-testing regressions from overlapping painted shapes are a recurring risk in this codebase — verified independently in both v1.0 (Phase 4, original drag/rotate implementation) and v1.1 (Phase 8, decorative badge overlay) — always attach pointer handlers to the actually-visible painted shape and mark non-interactive overlays `pointer-events: none` explicitly.
2. Manual browser verification is required, not optional, for any interaction that jsdom cannot simulate (drag geometry, real breakpoint collapse, anchor-scroll/redirect) — both milestones' UAT checkpoints found bugs automated tests missed.
3. Authoring infrastructure/tooling and live-exercising it against real systems are different confidence levels — v1.3's Phase 14 (author CI/deploy scripts) → Phase 15 (exercise against real GitHub/Vercel/Neon) split caught bugs (CI failures, a Vercel-linking mis-detection) that local dry-runs never surfaced, echoing v1.1/v1.2's "manual UAT catches what automation can't" lesson at the infrastructure layer.
