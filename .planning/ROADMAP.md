# Roadmap: COLREGS Navigator

## Milestones

- ✅ **v1.0** (2026-07-14 → 2026-07-18) — Domain foundations, COLREGS rules engine, persistence/API layer, interactive chart sandbox, save/share/gallery. 5 phases, 19 plans. See `.planning/milestones/v1.0-ROADMAP.md`.
- ✅ **v1.1 UI Redesign (shadcn)** (2026-07-18 → 2026-07-19) — Re-implemented the entire front end against an imported Claude Design file using shadcn/ui, dark-mode only, across 4 branch+PR phases (Scaffolding, Hero, Sandbox, Gallery). Zero change to domain logic or existing validated requirements. 4 phases, 14 plans, 19/19 requirements validated. See `.planning/milestones/v1.1-ROADMAP.md`.
- 🚧 **v1.2 Tech Debt & Stabilization** (started 2026-07-19) — ESLint tooling, deprecated Tailwind v4 class-name fixes, ChartPanel/SandboxContainer decomposition refactor, and comment-convention cleanup. No new user-facing features; zero change to domain logic outcomes. 4 phases, 22/22 requirements mapped.

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

### 🚧 v1.2 Tech Debt & Stabilization (In Progress)

**Milestone Goal:** Demonstrate professional engineering hygiene — clean lint, clean deprecated-class-name usage, clean file structure, clean comment history — as a portfolio signal, with zero new user-facing features and zero change to domain logic outcomes.

- [ ] **Phase 10: ESLint Setup & Lint-Clean Baseline** - Install ESLint (flat config), wire `npm run lint`, and reach a lint-clean baseline with architecture-boundary and convention-enforcing custom rules
- [ ] **Phase 11: Tailwind Deprecated Class-Name Fixes** - Replace deprecated Tailwind v3 class names with v4 canonical equivalents in the 6 flagged files, verified by hand
- [ ] **Phase 12: ChartPanel/SandboxContainer Decomposition Refactor** - Decompose the two oversized Sandbox files into focused modules, preserving all existing behavior and hit-testing
- [ ] **Phase 13: Comment Cleanup** - Rewrite stale Phase/Plan/REQ-ID comment references by hand, preserving substantive WHY content

## Phase Details

### Phase 10: ESLint Setup & Lint-Clean Baseline
**Goal**: The codebase has ESLint installed, configured, and wired into `npm run lint`, reaching a lint-clean baseline that also enforces this project's architecture boundary and existing documented conventions — without disabling or downgrading any rule to get there.
**Depends on**: Phase 9 (last completed phase; no code dependency, this is the first phase of v1.2)
**Requirements**: LINT-01, LINT-02, LINT-03, LINT-04, LINT-05, LINT-06, LINT-07, LINT-08
**Success Criteria** (what must be TRUE):
  1. `npm run lint` exists as a script and exits with zero errors when run against the full codebase.
  2. The flat config (`eslint.config.mjs`) applies `eslint-config-next`'s `core-web-vitals` + `typescript` sub-exports, `typescript-eslint` at the `recommended` tier, Tailwind v4-aware class-name rules, and Vitest-specific rules scoped only to test files.
  3. A test import of `src/server/`, Next.js, tRPC, or Prisma from within `src/domain/` produces a lint error, proving the architecture boundary is enforced, not just documented.
  4. Reintroducing a stale Phase/Plan/REQ-ID comment reference or a raw-CSS-as-template-literal string produces a lint error.
  5. No rule was set to `off` or downgraded project-wide to reach the clean baseline (verified by inspecting `eslint.config.mjs` and any `eslint-suppressions.json` used).
**Plans:** 3 plans
Plans:
- [ ] 10-01-PLAN.md — Install ESLint core toolchain, wire npm run lint/lint:fix, base flat config (core-web-vitals + typescript)
- [ ] 10-02-PLAN.md — Tailwind/Vitest plugins, architecture-boundary no-restricted-imports, custom stale-ID/raw-CSS rules
- [ ] 10-03-PLAN.md — Two-pass eslint --fix + suppress-all lint-clean baseline, recommended-type-checked stretch goal, .editorconfig + README

### Phase 11: Tailwind Deprecated Class-Name Fixes
**Goal**: All known deprecated Tailwind v3 class-name usages are replaced with their Tailwind v4 canonical equivalents, with no visual or accessibility regression.
**Depends on**: Phase 10 (lint tooling, including the Tailwind class-name plugin, must exist first to catch future regressions)
**Requirements**: TWFX-01, TWFX-02, TWFX-03, TWFX-04
**Success Criteria** (what must be TRUE):
  1. `outline-none` no longer appears as a Tailwind utility in `button.tsx`, `select.tsx`, `Header.tsx`, or `GalleryCard.tsx` — each now uses `outline-hidden`.
  2. Bare `rounded` no longer appears as a Tailwind utility in `SandboxContainer.tsx` or `ChartPanel.tsx` — each now uses `rounded-sm`.
  3. Non-Tailwind text and comments containing similar substrings (e.g. "Grounded in", "rounded to clean numbers") are unchanged.
  4. A human confirms in a real browser that Hero, Header, Gallery, and Sandbox show no visual or keyboard-focus-outline regression after the fixes.
**Plans**: TBD

### Phase 12: ChartPanel/SandboxContainer Decomposition Refactor
**Goal**: `ChartPanel.tsx` and `SandboxContainer.tsx` are decomposed into focused, single-concern modules following this project's established "split computation from presentation" convention, with zero behavior change and zero hit-testing regression.
**Depends on**: Phase 11 (both target files are touched by the Tailwind fix; sequencing the narrower manual fix first avoids compounding two risky edits to the same files)
**Requirements**: RFCT-01, RFCT-02, RFCT-03, RFCT-04, RFCT-05, RFCT-06, RFCT-07, RFCT-08
**Success Criteria** (what must be TRUE):
  1. `ChartPanel.tsx`'s pure geometry constants, `wedgePath()`, and `buildGridLineSegments()` live in `chart-panel-geometry.ts`; per-render derivation lives in a `deriveChartOverlayState()` function in `chart-panel-derivation.ts`.
  2. Decorative chart chrome and resize observation live in `ChartBackdrop.tsx` and `hooks/useContainerSize.ts`.
  3. `SandboxContainer.tsx`'s state machine (`applyVesselUpdate`, chip/reset/save handlers) lives in a `useSandboxState()` hook, and Rule 13(d) hysteresis behavior is unchanged.
  4. `VesselGroup.tsx` (hull polygon, rotate-handle circle, `pointerEvents="none"` badge overlay) is extracted as one atomic unit; dragging and rotating both vessels at heading 0 in a real browser shows no hit-testing regression, confirmed by both the point-in-polygon regression check and manual testing.
  5. Both `ChartPanel.tsx` and `SandboxContainer.tsx` land under the project's ~150-200 line convention, and the full existing Vitest/RTL suite passes with only import-path updates (no behavior-driven test changes).
**Plans**: TBD

### Phase 13: Comment Cleanup
**Goal**: Stale Phase/Plan/REQ-ID references embedded in code comments are rewritten by hand to preserve their substantive WHY content while removing the rotting identifier, retroactively enforcing this project's existing comment convention across files that predate it.
**Depends on**: Phase 12 (no structural code dependency, but sequenced last to avoid adding review noise to the higher-risk lint/refactor phases)
**Requirements**: CMNT-01, CMNT-02
**Success Criteria** (what must be TRUE):
  1. A grep across `src/` and `app/` for Phase/Plan/REQ-ID patterns (both the original strict numeric pattern and a broader re-grep, e.g. "this phase"/"this plan") returns zero remaining stale references.
  2. Every rewritten comment retains its full substantive WHY explanation — reviewed diff shows only identifier removal, no loss of reasoning.
  3. The broader re-grep pass is documented as having been run, confirming the original scoping count was not treated as exhaustive.
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 10 → 11 → 12 → 13

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-5 | v1.0 | 19/19 | Complete | 2026-07-18 |
| 6. Scaffolding | v1.1 | 2/2 | Complete | 2026-07-18 |
| 7. Hero | v1.1 | 2/2 | Complete | 2026-07-18 |
| 8. Sandbox | v1.1 | 6/6 | Complete | 2026-07-18 |
| 9. Gallery | v1.1 | 4/4 | Complete | 2026-07-19 |
| 10. ESLint Setup & Lint-Clean Baseline | v1.2 | 0/3 | Not started | - |
| 11. Tailwind Deprecated Class-Name Fixes | v1.2 | 0/TBD | Not started | - |
| 12. ChartPanel/SandboxContainer Decomposition Refactor | v1.2 | 0/TBD | Not started | - |
| 13. Comment Cleanup | v1.2 | 0/TBD | Not started | - |
