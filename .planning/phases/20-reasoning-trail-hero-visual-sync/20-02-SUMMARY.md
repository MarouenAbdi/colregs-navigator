---
phase: 20-reasoning-trail-hero-visual-sync
plan: 02
subsystem: ui
tags: [react, tailwind, css-animation, reasoning-trail, sandbox]

# Dependency graph
requires:
  - phase: 20-01
    provides: "app/globals.css CSS-only animation primitives (.radar-sweep-dot--lg, .trail-connector, .trail-connector-pulse, .trail-token, .trail-token-sweep-ring) gated behind prefers-reduced-motion"
provides:
  - "Horizontal 'NAV DECISION CHAIN' ReasoningTrail restructure (two-list-item-per-step, min-[900px]:flex-row / base flex-col)"
  - "D-07 copy changes (header subtitle, '{n} contacts' badge)"
  - "38px radar-token step numbering, CONTACT 0N labels, corner-bracket + accent-bar card framing, all --tone-color driven"
affects: [20-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "trail.flatMap() emitting [card, connector?] pairs per step, keyed distinctly (-card/-wire) to avoid key collisions between element types"
    - "TONE_ACCENT_VAR / TONE_LAST_CARD_STYLE lookup maps (mirrors existing TONE_TAG_CLASSNAME pattern) for tone-driven inline style, avoiding inline color-mix() string composition at call sites"
    - "CornerBrackets shared subcomponent for 4 near-identical corner-tick spans (CLAUDE.md no-duplicated-JSX convention)"

key-files:
  created: []
  modified:
    - src/components/sandbox/reasoning/ReasoningTrail.tsx
    - src/components/sandbox/reasoning/ReasoningTrail.test.tsx
    - src/components/sandbox/SandboxContainer.test.tsx
    - eslint.config.mjs

key-decisions:
  - "Extended eslint.config.mjs's better-tailwindcss/no-unknown-classes ignore regex to cover radar-sweep-dot--lg and the trail-connector/trail-token families (plain CSS classes from app/globals.css, not Tailwind utilities)"
  - "Dropped a redundant flex-none from the connector <li> (flex-[0_0_26px] already fully specifies flex; the pair was flagged as conflicting by better-tailwindcss/no-conflicting-classes)"
  - "Removed the now-dead TONE_NUMBER_CLASSNAME lookup map once its only consumer (the old 22px number badge) was replaced by the 38px token in Task 2"

patterns-established:
  - "data-role=\"trail-card\" attribute distinguishes meaningful card <li>s from decorative connector <li>s for both accessibility (aria-hidden on connectors) and test querying, once a component interleaves structural and decorative list items in the same <ol>"

requirements-completed: [SBOX-09]

duration: ~45min
completed: 2026-07-27
---

# Phase 20 Plan 02: Reasoning Trail Horizontal Restructure Summary

**Restructured `ReasoningTrail.tsx` from a wrapping card grid into a true horizontal "NAV DECISION CHAIN" — flex-row step cards joined by CSS-only animated connectors (dashed marching-ants line + traveling pulse dot + spinning token sweep-ring), stacking to a column below 900px, with all 23 existing/updated component and integration tests passing.**

## Performance

- **Duration:** ~45 min
- **Tasks:** 3 completed
- **Files modified:** 4 (`ReasoningTrail.tsx`, `ReasoningTrail.test.tsx`, `SandboxContainer.test.tsx`, `eslint.config.mjs`)

## Accomplishments

- `ReasoningTrail.tsx`'s `<ol>` now renders a single `trail.flatMap()` pass producing a `flex:1 1 0`-equivalent card `<li>` plus an `aria-hidden` `flex:0 0 34px`-equivalent connector `<li>` after every non-last step — `min-[900px]:flex-row` for the horizontal row, base `flex-col` for the <900px stack (D-08), with zero `getBoundingClientRect()`/`getBBox()` calls (CSS-only per Roadmap criterion 2).
- Header copy now reads "NAV DECISION CHAIN · radar acquisition" with a 14px `radar-sweep-dot--lg` token, and the count badge reads "{n} contacts" instead of "{n} steps" (D-07, locked verbatim).
- Each card renders a 38px radial-gradient token with a spinning `.trail-token-sweep-ring`, a "CONTACT 0N" label, a top accent bar, and 4 corner-tick brackets — all driven by a single `--tone-color` custom property per step, via new `TONE_ACCENT_VAR`/`TONE_LAST_CARD_STYLE` lookup maps mirroring the file's existing tone-map pattern. The last (VERDICT) card gets its own `color-mix()`-based border/glow via `TONE_LAST_CARD_STYLE`.
- `ReasoningTrail.test.tsx`'s 7 tests and `SandboxContainer.test.tsx`'s full suite (16 tests) both pass against the restructured DOM shape — card-count/`dl`-count assertions now scope to `[data-role="trail-card"]` instead of `getAllByRole("listitem")`, since the `<ol>` now interleaves `2 * trail.length - 1` total list items (cards + connectors).

## Task Commits

1. **Task 1: Header copy/dot change + two-list-item-per-step skeleton** - `8c63654` (feat)
2. **Task 2: Card content enrichment — token, corner brackets, accent bar, contact label** - `6e55ccd` (feat)
3. **Task 3: Update ReasoningTrail.test.tsx and SandboxContainer.test.tsx for new copy and DOM shape** - `5182433` (test)

## Files Created/Modified

- `src/components/sandbox/reasoning/ReasoningTrail.tsx` - Restructured header (dot + D-07 copy) and body (`trail.flatMap()` two-`<li>`-per-step, token/corner-bracket/accent-bar card enrichment, `CornerBrackets` subcomponent, `TONE_ACCENT_VAR`/`TONE_LAST_CARD_STYLE` lookup maps)
- `src/components/sandbox/reasoning/ReasoningTrail.test.tsx` - Copy assertions updated to "contacts"; card/dl-count assertions scoped to `[data-role="trail-card"]`
- `src/components/sandbox/SandboxContainer.test.tsx` - `reasoningTrailCard()` helper now matches `/NAV DECISION CHAIN/` instead of the removed exact "Reasoning Trail" string
- `eslint.config.mjs` - Extended `better-tailwindcss/no-unknown-classes` ignore regex to cover `radar-sweep-dot--lg` and the `trail-connector`/`trail-token` class families (real plain-CSS classes from `app/globals.css`, not Tailwind utilities)

## Decisions Made

- eslint's `better-tailwindcss` plugin can't generate CSS for non-utility plain-CSS classes, so consuming any of plan 20-01's new classes required extending the existing `radar-sweep-dot` ignore-regex precedent rather than inventing a new suppression mechanism.
- Removed a redundant `flex-none` Tailwind class from the connector `<li>` (conflicted with `flex-[0_0_26px]`, which already fully specifies the `flex` shorthand) rather than suppressing the lint rule.
- Deleted the now-unused `TONE_NUMBER_CLASSNAME` lookup map once Task 2 replaced its only consumer (the old 22px circular number badge) with the 38px token, keeping the file free of dead code.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Extended eslint.config.mjs's better-tailwindcss ignore regex**
- **Found during:** Task 1 (pre-commit hook run)
- **Issue:** `radar-sweep-dot--lg`, `trail-connector`, and `trail-connector-pulse` (plain CSS classes added by plan 20-01 in `app/globals.css`) were flagged as "Unknown class" by `better-tailwindcss/no-unknown-classes`, blocking the commit via the repo's `lint-staged` pre-commit hook.
- **Fix:** Extended the existing single-class ignore regex (`^radar-sweep-dot$`) into a small array covering the `radar-sweep-dot(--lg)?`/`trail-connector(-pulse)?`/`trail-token(-sweep-ring)?` families, matching the precedent comment already in that config block.
- **Files modified:** `eslint.config.mjs`
- **Verification:** `npx eslint` reports 0 errors on the modified component file; pre-commit hook passes.
- **Committed in:** `8c63654` (Task 1 commit)

**2. [Rule 1 - Bug] Removed conflicting flex-none/flex-[0_0_26px] pair**
- **Found during:** Task 1 (pre-commit hook run)
- **Issue:** The connector `<li>`'s className carried both `flex-none` and `flex-[0_0_26px]`, both of which set the CSS `flex` shorthand — `better-tailwindcss/no-conflicting-classes` flagged this as a genuine redundancy/bug, not just style.
- **Fix:** Dropped `flex-none`, since `flex-[0_0_26px]` (grow:0, shrink:0, basis:26px) already fully expresses the same non-growing/non-shrinking intent with a fixed basis.
- **Files modified:** `src/components/sandbox/reasoning/ReasoningTrail.tsx`
- **Verification:** `npx eslint` clean; connector still renders at the fixed 26px/34px bands per breakpoint.
- **Committed in:** `8c63654` (Task 1 commit)

**3. [Rule 2 - Missing critical] Removed dead TONE_NUMBER_CLASSNAME lookup map**
- **Found during:** Task 2
- **Issue:** Replacing the 22px number badge with the 38px token left `TONE_NUMBER_CLASSNAME` with zero remaining consumers — dead code that would otherwise silently rot.
- **Fix:** Deleted the map and updated the adjacent comment (which referenced it by name) to stop citing a map that no longer exists.
- **Files modified:** `src/components/sandbox/reasoning/ReasoningTrail.tsx`
- **Verification:** `npx tsc --noEmit` clean; no other references to `TONE_NUMBER_CLASSNAME` remain in the file.
- **Committed in:** `6e55ccd` (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (1 blocking lint-config extension, 1 bug/conflicting-class fix, 1 dead-code removal)
**Impact on plan:** All three were necessary to reach a lint-clean, dead-code-free commit; no scope creep beyond the plan's own files (`eslint.config.mjs` is a config file, not a new feature surface).

## Issues Encountered

None beyond the deviations above — all three tasks' acceptance criteria (grep checks, `npx tsc --noEmit`, `npx vitest run`) passed on the first or second attempt.

The full repo-wide `npx vitest run` sanity check (outside this plan's own verification scope) surfaced 4 pre-existing failing test files (`GalleryContainer.test.tsx`, `scenario-service.test.ts`, `scenario-repository.test.ts`, `scenario.test.ts`) — all caused by this worktree missing a generated Prisma client / `DATABASE_URL` (an environment-provisioning gap, not a regression from this plan's two touched files). Logged in `.planning/phases/20-reasoning-trail-hero-visual-sync/deferred-items.md`, not fixed, per the scope-boundary rule.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `ReasoningTrail.tsx` now matches the design's horizontal "NAV DECISION CHAIN" structurally and copy-wise; plan 20-05's human-browser verification (real 3/4/5-step layout at both breakpoints, real animation rendering) is the remaining gate for SBOX-09/Roadmap criteria 1-2, since this plan's automated checks cover structure/copy/DOM shape only, not real-browser visual rendering.
- No blockers for plan 20-03/20-04 (Hero visual sync) — this plan touched only `ReasoningTrail.tsx` and its two test files, no shared modules.

---
*Phase: 20-reasoning-trail-hero-visual-sync*
*Completed: 2026-07-27*
