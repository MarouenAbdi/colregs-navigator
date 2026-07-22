# Milestones

## v1.3 CI/CD & Deployment (Shipped: 2026-07-22)

**Phases completed:** 2 phases, 9 plans, 16 tasks

**Key accomplishments:**

- GitHub Actions CI pipeline (lint/typecheck/test/build) reusing docker-compose.yml's Postgres, gated by a new .nvmrc-pinned Node version and an automatic postinstall Prisma-generate step
- Proved plan 14-01's ci.yml actually runs and passes on a live PR, fixed three real CI bugs surfaced only by that live exercise, then made the repo public and enforced branch protection on main so all four checks genuinely gate merges (CI-01 and CI-05 both closed)
- Husky 9 + lint-staged 17 pre-commit hook (staged-file `eslint --fix` + `.env*` commit guard) and a `CONTRIBUTING.md` documenting the actually-verified hook/setup/CI behavior
- Environment-gated `prisma migrate deploy` wired into a new `vercel-build` script (`prisma generate` -> gate -> `next build --webpack`), verified locally in both gate states and end-to-end.
- Public, unauthenticated `GET /api/health` Route Handler that runs a real `SELECT 1` through the app's existing Prisma singleton and returns 200/503 with no-store caching, locally verified end-to-end against a live Postgres container in both healthy and DB-down states.
- Confirmed via Vercel CLI (not dashboard screenshots) that the real colregs-navigator production deployment is Ready, was built by the exact locked `vercel-build` sequence with zero PgBouncer/prepared-statement error, has `DATABASE_URL` configured, and serves both the front end and a real DB-backed `/api/health` check to genuine external HTTP requests -- then updated README.md to state this live, non-aspirational status.
- Live-exercised the HEALTH-04 rollback/promote cycle against real Vercel deployment IDs, documenting the verified commands as a Rollback Procedure subsection in README.md
- Confirmed production `/api/health` returns 200 `{"status":"ok"}` after a genuine 8+ hour zero-traffic idle window, closing out v1.3's last requirement (HEALTH-03)

---

## v1.2 Tech Debt & Stabilization (Shipped: 2026-07-20)

**Phases completed:** 4 phases, 18 plans, 41 tasks

**Key accomplishments:**

- ESLint installed and configured via flat config, reaching a lint-clean baseline (`npm run lint`, 0 errors) despite a real mid-execution blocker: `typescript-eslint`/`eslint-config-next` don't support this project's locked TypeScript 7.0.2 (tsgo) — bypassed via `@next/eslint-plugin-next` + `@babel/eslint-parser`, with `npm run typecheck` still covering type safety. A `no-restricted-imports` rule lint-enforces the `src/domain/` architecture boundary (not just documents it), and a custom rule catches stale Phase/Plan/REQ-ID comment references going forward.
- Deprecated Tailwind v3 class names (`outline-none`→`outline-hidden` in 4 files, bare `rounded`→`rounded-sm` in 2 files) renamed by hand, scoped around known false-positive text traps; closed with a human-verified browser walkthrough (Hero, Header, Gallery, Sandbox) confirming no visual or keyboard-focus-outline regression.
- `ChartPanel.tsx` and `SandboxContainer.tsx` decomposed into focused single-concern modules (geometry, derivation, resize hook, `useSandboxState()`, and a byte-for-byte `VesselGroup.tsx` extraction moved last per this project's two prior hit-testing-regression precedent); both files now land under the ~150-200 line convention with zero behavior or hit-testing regression, human-confirmed in a real browser.
- Stale Phase/Plan/REQ-ID comment references rewritten by hand across 66 files, preserving full WHY content; a broader re-grep beyond the original strict pattern caught additional real gaps the initial scoping undercounted, including a self-inflicted regex collision introduced by an earlier rewrite in the same phase. `eslint-suppressions.json` pruned 122→51. Human sign-off approved 2026-07-20.
- A session interruption mid-Phase-13 (6 parallel worktree-executor agents killed by a `/login` re-auth) was recovered via manual orchestrator close-out rather than a from-scratch re-run, with zero lost work and two real content bugs caught during the recovery review.

---

## v1.1 UI Redesign (shadcn) (Shipped: 2026-07-19)

**Phases completed:** 4 phases, 14 plans, 31 tasks

**Key accomplishments:**

- shadcn/ui installed (Radix base) with a single locked dark-token palette, Geist/Geist Mono fonts, and a sticky Header/Footer page shell wired into `app/layout.tsx` for every route.
- User confirmed dark-only rendering, responsive Header collapse, Geist font application, Source link behavior, and Footer copy all match spec with no console errors
- Net-new Hero section (headline/CTAs/trust-note) above the Sandbox, with a fully static SVG "Live classification" preview card whose RANGE/BEARING/CPA/Rule-15/verdict numbers are computed by a real `classifyEncounter()`/`bearing()`/`cpa()` call against a fixed, verified fixture.
- Human verification confirmed Plan 07-01's Hero section matches the design mock, is fully static, collapses correctly at both breakpoints, and its CTAs scroll-navigate cleanly with no console errors.
- Registered 7 missing dark-theme semantic tokens, vendored shadcn Select/Slider/Label, consolidated role-styling into vessel-role.ts, and built 4 pure derivation modules (6 chip fixtures verified against the real classifyEncounter(), instrument readouts, status-pill copy, reasoning-trail tag helpers) that every Wave 2/3 Sandbox component will import.
- Re-themed ChartPanel.tsx's remaining raw hex literals to semantic Tailwind tokens, consolidated its hull-fill/role-badge maps into vessel-role.ts, and added a proportionally-accurate "1 NM" scale-bar legend -- with zero changes to hull/rotate-handle hit-testing geometry or pointer handler wiring.
- Swapped ControlPanel.tsx's native `<input type="number">`/`<select>` for shadcn `Slider`/`Select` inside a per-vessel `Card` with a letter-chip + role-badge header row, and fully rewrote `ControlPanel.test.tsx`'s interaction assertions for the Radix primitive click/keyboard pattern, preserving the exact `onVesselSpeedChange`/`onVesselTypeChange` call contract.
- Split the single `ReasoningPanel` aside into 3 design-matching cards -- `VerdictBanner` (rule badge + standalone title/description + role badges), `InstrumentReadouts` (2x2 grid + status pill), `ReasoningTrail` (dynamic-length numbered trail with position-derived tags) -- each independently tested with zero behavior regression.
- Restyled SandboxContainer's header/layout and composed the 3 split reasoning cards into the design's responsive 2-col/full-width grid, wired the 6-chip preset row through the existing applyVesselUpdate/handleReset choke point, restyled CopyLinkButton to an icon button, and fully rewrote SandboxContainer.test.tsx (12/12 green) for the new markup -- closing out every remaining Wave 2 transitional typecheck error.
- Human-verified PASS for all 6 required checks (drag/rotate hit-testing, visual fidelity, chip-row correctness, Save/Reset, responsive breakpoints) after an interactive UAT session that surfaced and fixed 11 rounds of styling/layout drift between the initial restyle and the design -- including a live re-sync against a freshly updated Claude Design source imported mid-session.
- Rewrote the gallery's 6 curated Postgres rows (via 3 new domain fixtures, a corrected curatedScenarios array, and a Scenario.title/ruleLabel schema migration) so `gallery.list()` returns exactly the design's 6 labeled cards with no mirror-pair duplicate.
- Extracted Hero's reusable hull/heading-vector/midpoint SVG geometry into `src/components/shared/static-chart-geometry.ts` and built `GalleryPreviewChart.tsx`, a parametrized role-colored mini-chart with a per-card dynamic viewBox spanning the gallery's 1.0-10.0 NM vessel-pair range.
- Gallery section (6-card responsive grid) server-rendered on the home page below Sandbox, consuming Plan 01's curated data and Plan 02's GalleryPreviewChart; `/gallery` route removed in favor of a permanent redirect.
- Human-confirmed GAL-03 redirect/anchor-scroll behavior and GAL-01 responsive grid fidelity, plus 4 design-fidelity fixes found and resolved during the checkpoint

---
