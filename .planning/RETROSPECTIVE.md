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

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | - | 5 | Established domain-first architecture (rules engine before UI); no retrospective captured at close |
| v1.1 | - | 4 | First milestone with a `RETROSPECTIVE.md`; introduced the "extract on second real consumer" and "WHY-only comments" conventions during Phase 7, applied through Phase 9 |

### Cumulative Quality

| Milestone | Tests | Coverage | Zero-Dep Additions |
|-----------|-------|----------|-------------------|
| v1.0 | - | - | - |
| v1.1 | 196/196 passing (32 files, end of Phase 8) | not tracked | shadcn/ui, Radix primitives (already-planned dependency, not zero-dep) |

### Top Lessons (Verified Across Milestones)

1. SVG hit-testing regressions from overlapping painted shapes are a recurring risk in this codebase — verified independently in both v1.0 (Phase 4, original drag/rotate implementation) and v1.1 (Phase 8, decorative badge overlay) — always attach pointer handlers to the actually-visible painted shape and mark non-interactive overlays `pointer-events: none` explicitly.
2. Manual browser verification is required, not optional, for any interaction that jsdom cannot simulate (drag geometry, real breakpoint collapse, anchor-scroll/redirect) — both milestones' UAT checkpoints found bugs automated tests missed.
