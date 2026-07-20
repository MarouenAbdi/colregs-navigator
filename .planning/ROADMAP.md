# Roadmap: COLREGS Navigator

## Milestones

- ✅ **v1.0** (2026-07-14 → 2026-07-18) — Domain foundations, COLREGS rules engine, persistence/API layer, interactive chart sandbox, save/share/gallery. 5 phases, 19 plans. See `.planning/milestones/v1.0-ROADMAP.md`.
- ✅ **v1.1 UI Redesign (shadcn)** (2026-07-18 → 2026-07-19) — Re-implemented the entire front end against an imported Claude Design file using shadcn/ui, dark-mode only, across 4 branch+PR phases (Scaffolding, Hero, Sandbox, Gallery). Zero change to domain logic or existing validated requirements. 4 phases, 14 plans, 19/19 requirements validated. See `.planning/milestones/v1.1-ROADMAP.md`.
- ✅ **v1.2 Tech Debt & Stabilization** (2026-07-19 → 2026-07-20) — ESLint tooling, deprecated Tailwind v4 class-name fixes, ChartPanel/SandboxContainer decomposition refactor, and comment-convention cleanup. No new user-facing features; zero change to domain logic outcomes. 4 phases, 18 plans, 22/22 requirements validated. See `.planning/milestones/v1.2-ROADMAP.md`.

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
| 10. ESLint Setup & Lint-Clean Baseline | v1.2 | 3/3 | Complete    | 2026-07-19 |
| 11. Tailwind Deprecated Class-Name Fixes | v1.2 | 3/3 | Complete    | 2026-07-20 |
| 12. ChartPanel/SandboxContainer Decomposition Refactor | v1.2 | 4/4 | Complete   | 2026-07-20 |
| 13. Comment Cleanup | v1.2 | 8/8 | Complete | 2026-07-20 |
