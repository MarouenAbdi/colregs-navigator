---
phase: 20-reasoning-trail-hero-visual-sync
verified: 2026-07-31T19:55:00Z
status: passed
score: 4/4 must-haves verified
overrides_applied: 0
---

# Phase 20: Reasoning Trail & Hero Visual Sync Verification Report

**Phase Goal:** The reasoning trail and Hero preview card visually match the updated design file, purely additive/cosmetic changes with zero classification-output change.
**Verified:** 2026-07-31T19:55:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Reasoning trail renders as a horizontal sequence of connected step cards ("NAV DECISION CHAIN") instead of a vertical list, correctly for varying trail lengths | ✓ VERIFIED | `src/components/sandbox/reasoning/ReasoningTrail.tsx:203-206` — `<ol className="flex flex-col ... min-[900px]:flex-row">` with `trail.flatMap()` emitting a card `<li>` + connector `<li>` pair per non-last step (lines 207-311). Header reads "NAV DECISION CHAIN · radar acquisition" (line 193) and badge reads "{n} contacts" (line 199). Human-verified in a real browser at 3/4/5-step trails, single row at ≥900px, stacked <900px (20-05-SUMMARY.md Task 1). |
| 2 | Connector treatment between trail cards is CSS-only (no getBoundingClientRect/getBBox), renders correctly across step counts, human-verified in real browser | ✓ VERIFIED | `grep -c "getBoundingClientRect\|getBBox" ReasoningTrail.tsx` = 0 (confirmed directly). `.trail-connector`/`.trail-connector-pulse`/`.trail-token-sweep-ring` all defined in `app/globals.css:249-330` as static-base + `@media (prefers-reduced-motion: no-preference)`-gated `animation:` declarations (grep-confirmed). Human-verified all 5 animation layers running by default and going fully static under real OS Reduce Motion toggle (20-05-SUMMARY.md Task 2, human typed "approved, all 5 go static under reduce motion"). |
| 3 | Hero preview card's bezel accents, radar sweep overlay, and readout styling visually match the updated design file, card remains fully static/fixture-driven with unchanged classification values | ✓ VERIFIED | `src/components/hero/HeroPreviewCard.tsx` renders 3 range rings (`HERO_RANGE_RING_RADII_PX[0\|1\|2]`, lines 219-242), dashed 2-layer compass-tick ring + crosshair + N/S/E/W labels + 3 range labels + center hub (lines 244-356), `.hero-radar-sweep`/`.hero-radar-sweep-inner` overlay div as an absolutely-positioned sibling of `<svg>` inside a `relative` wrapper (lines 197-199, 424-426). Header strip (rule chip + title + risk pill, lines 163-195) and footer strip (LIVE + RANGE + BEARING A→B + CPA + TCPA, lines 429-453) replace the old eyebrow/verdict-banner/3-tile-grid (confirmed absent via grep and human DOM inspection). `classifyEncounter()`/`bearing()`/`cpa()` call sites and the fixture (`hero-preview-fixture.ts`) untouched — same function calls at lines 115/124/130, same fixture import. `viewBox="0 0 320 200"` unchanged (line 200). Human-verified via DOM/computed-style inspection and 6-point visual checklist (20-05-SUMMARY.md Task 3). |
| 4 | No regression to Hero's fixture-driven classification values or any other Sandbox content during this pass | ✓ VERIFIED | `npx vitest run` (full suite): 43 test files, 260 tests, all pass — no regressions anywhere in the repo. `npx tsc --noEmit`: 0 errors project-wide. Human-verified classification values unchanged (Crossing/2.99 NM/061°/1.18 NM), card height unchanged, `/#gallery` anchor scroll lands at exactly 64px (matching `scroll-padding-top`), no other Sandbox/Gallery/Tour surface regressed (20-05-SUMMARY.md Task 4, human approved). |

**Score:** 4/4 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `app/globals.css` | 8 new CSS rules/keyframes (trail-connector/-pulse, trail-token/-sweep-ring, radar-sweep-dot--lg, hero-radar-sweep/-inner, hero-live-pulse), static-base + reduced-motion-gated | ✓ VERIFIED | All classes and `@keyframes conduit/travel/sweep/hero-live-pulse` present (grep-confirmed); existing `.radar-sweep-dot` 8px rule/consumers unmodified. |
| `src/components/sandbox/reasoning/ReasoningTrail.tsx` | Horizontal two-`<li>`-per-step trail markup referencing globals.css classes | ✓ VERIFIED | `trail-connector`/`trail-token`/`trail-token-sweep-ring` classNames present; `data-role="trail-card"` on card `<li>`; connector `<li>` is `aria-hidden="true"`. |
| `src/components/hero/hero-preview-geometry.ts` | 3-ring radii + compass-bezel constants; retired constants fully removed | ✓ VERIFIED | `HERO_RANGE_RING_RADII_PX`, `HERO_COMPASS_*`, `HERO_CARDINAL_LABEL_OFFSET_PX`, `HERO_RANGE_LABEL_TEXT` all present; `HERO_OUTER_RING_RADIUS_PX`/`HERO_INNER_RING_RADIUS_PX` — zero remaining references anywhere in the codebase (grep-confirmed). |
| `src/components/hero/hero-preview-risk.ts` | Hero-local copy of chart-header-risk.ts's CPA-threshold logic (no import) | ✓ VERIFIED | File exists, exports `deriveHeroPreviewRisk`, zero import of/from `chart-header-risk.ts` in either direction (grep-confirmed). |
| `src/components/hero/HeroPreviewCard.tsx` | Header/footer strip restructuring + bezel SVG extension + radar-sweep overlay | ✓ VERIFIED | All elements present as itemized above; `viewBox` unchanged; zero `getBoundingClientRect`/`getBBox`. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `ReasoningTrail.tsx` connector `<li>` className | `app/globals.css`'s `.trail-connector`/`.trail-connector-pulse` | shared className string | ✓ WIRED | Lines 305-306: `<div className="trail-connector w-full" />` / `<div className="trail-connector-pulse" />`. |
| `ReasoningTrail.tsx` card token div className | `app/globals.css`'s `.trail-token`/`.trail-token-sweep-ring` | shared className string | ✓ WIRED | Lines 248/253. |
| `HeroPreviewCard.tsx` risk pill | `hero-preview-risk.ts`'s `deriveHeroPreviewRisk()` | direct function call | ✓ WIRED | Line 158, imported line 40, called with real `cpaResult.value` fields. |
| `HeroPreviewCard.tsx` bezel SVG | `hero-preview-geometry.ts`'s new constants | named import | ✓ WIRED | Import block lines 19-36; every constant consumed in the SVG body. |
| `HeroPreviewCard.tsx` overlay div className | `app/globals.css`'s `.hero-radar-sweep`/`.hero-radar-sweep-inner` | shared className string | ✓ WIRED | Lines 424-426. |

### Data-Flow Trace (Level 4)

Not applicable in the usual sense — this phase is explicitly presentation-only over an already-existing, unchanged data path (`classifyEncounter()`/`bearing()`/`cpa()` against a fixed fixture for Hero; `classification.trail` prop for the Reasoning Trail). Confirmed no new data source was introduced and no existing data source was disconnected:
- Hero: `classifyEncounter(heroPreviewVesselA, heroPreviewVesselB)` → `result.value` → `classification` used directly in header/footer/bezel (lines 115-158). Same call signature, same fixture, as before this phase.
- Reasoning Trail: `classification.trail` (prop) → `trail.flatMap()` renders every real entry, tag/tone/facts all still derived from the actual `ReasoningTrailEntry` data (`trailStepTag()`, `FactReadout`), not hardcoded.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| No JS-measurement dependency in ReasoningTrail.tsx | `grep -c "getBoundingClientRect\|getBBox" ReasoningTrail.tsx` | 0 | ✓ PASS |
| No JS-measurement dependency in HeroPreviewCard.tsx | `grep -c "getBoundingClientRect\|getBBox" HeroPreviewCard.tsx` | 0 | ✓ PASS |
| Retired Hero ring constants fully removed | `grep -c "HERO_OUTER_RING_RADIUS_PX\|HERO_INNER_RING_RADIUS_PX" hero-preview-geometry.ts HeroPreviewCard.tsx` | 0/0 | ✓ PASS |
| Project-wide typecheck | `npx tsc --noEmit` | 0 errors | ✓ PASS |
| Scoped test suites (Hero + ReasoningTrail + SandboxContainer) | `npx vitest run <4 files>` | 4 files / 27 tests passed | ✓ PASS |
| Full repo test suite (regression check) | `npx vitest run` | 43 files / 260 tests passed | ✓ PASS |

### Probe Execution

Not applicable — no `scripts/*/tests/probe-*.sh` probes declared or discovered for this phase; this is a UI/presentation phase, not a migration/CLI/tooling phase. Step 7c skipped.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|--------------|------------|-------------|--------|----------|
| SBOX-09 | 20-02 | Reasoning trail renders as a horizontal sequence of connected step cards ("NAV DECISION CHAIN"), replacing the vertical list | ✓ SATISFIED | Truth #1/#2 above; code + human-verification evidence. |
| HERO-05 | 20-03/20-04 | Hero's live-classification preview card visual details (bezel accents, radar sweep overlay, readout styling) synced to design file; card remains static/fixture-driven | ✓ SATISFIED | Truth #3/#4 above; code + human-verification evidence. |

No orphaned requirements — REQUIREMENTS.md maps only SBOX-09 and HERO-05 to Phase 20, and both are claimed and satisfied by this phase's plans.

**Documentation-lag note (non-blocking):** `.planning/REQUIREMENTS.md`'s checkboxes for SBOX-09/HERO-05 are still unchecked (`[ ]`) and its Traceability table still lists both as "Pending," even though the phase is complete and `.planning/ROADMAP.md` has already been updated (uncommitted working-tree change) to mark Phase 20 complete. This is a tracking-doc gap, not a code gap — recommend updating REQUIREMENTS.md's checkboxes/status column to "Complete" alongside the ROADMAP.md update when this phase is closed out.

### Anti-Patterns Found

No debt markers (`TBD`/`FIXME`/`XXX`/`TODO`/`HACK`/`PLACEHOLDER`) found in any file modified by this phase.

Carried forward from `20-REVIEW.md` (already run this phase, 0 critical / 4 warning / 3 info, `status: issues_found` at the code-review gate) — none of these block goal achievement, since all 4 Roadmap success criteria are independently satisfied regardless of these findings:

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `HeroPreviewCard.tsx` | 114-457 | Component mixes derived computation (domain Result-unwrapping, geometry) with 300 lines of JSX, exceeding this repo's documented ~150-200 line split-computation-from-presentation convention | ⚠️ Warning | Maintainability only — no functional/visual impact; the goal ("visually matches design file") is unaffected. |
| `HeroPreviewCard.tsx` | 219-242 | 3 range-ring `<circle>` elements hand-copied instead of `.map()`'d over `HERO_RANGE_RING_RADII_PX` (unlike the parallel `HERO_RANGE_LABEL_TEXT.map()` a few lines below) | ⚠️ Warning | Drift risk if the ring count ever changes again — not a current functional defect. |
| `HeroPreviewCard.tsx` | 286-333 | 4 cardinal N/S/E/W `<text>` labels hand-duplicated instead of a data-driven loop | ⚠️ Warning | Convention violation (CLAUDE.md's no-duplicated-JSX rule) — cosmetic output is correct today. |
| `Hero.test.tsx` | 31 | `"2.99 NM" appears twice` assertion uses `toBeGreaterThan(0)` instead of `toHaveLength(2)`, weaker than the comment describes | ⚠️ Warning | Test-quality gap, not a production bug — doesn't affect whether the phase goal is met. |
| `ReasoningTrail.tsx` | 31-48 | `formatFactValue` uses unchecked `as number` casts | ℹ️ Info | Pre-existing pattern risk, not introduced by this phase's restructuring. |
| `app/globals.css` | 209-213, 350-354 | `radar-sweep`/`sweep` keyframes are functionally duplicate | ℹ️ Info | Cosmetic CSS duplication, zero behavioral difference. |
| `HeroPreviewCard.tsx` | 450 | `Math.round(...).padStart(3,"0")` could format "360°" for values ≥359.5 | ℹ️ Info | Not reachable with this phase's fixed fixture (bearing ~061°); pre-existing pattern also present elsewhere in the codebase. |

None of these are blockers: 0 critical findings, and every roadmap success criterion is independently verified as true in the current codebase state.

### Human Verification Required

None outstanding. Plan 20-05 (`checkpoint:human-verify`, 4 blocking tasks, zero files modified) was walked through interactively in this session with live browser automation (Chrome DevTools) plus one required manual action (toggling the OS's Reduce Motion setting, which cannot be simulated remotely). The human explicitly approved all 4 tasks, with the final message: "approved, all 5 go static under reduce motion" (documented in `20-05-SUMMARY.md`). This satisfies Roadmap success criteria 1, 2 (in part), 3, and 4's human-verification requirements — no further human sign-off is needed for this phase.

### Gaps Summary

No gaps. All 4 ROADMAP Phase 20 success criteria are independently verified true in the current codebase:
1. Horizontal "NAV DECISION CHAIN" trail — confirmed via code structure (`trail.flatMap()`, `min-[900px]:flex-row`) and human browser verification across 3/4/5-step trails.
2. CSS-only connector treatment, no `getBoundingClientRect`/`getBBox`, reduced-motion gating — confirmed via grep + globals.css structure + human OS-level Reduce Motion toggle test.
3. Hero bezel/radar-sweep/readout visual sync to the design file, fully static/fixture-driven — confirmed via code (unchanged `classifyEncounter`/`bearing`/`cpa`/fixture calls, unchanged viewBox) and human DOM/visual inspection.
4. Zero regression — confirmed via full-suite test pass (43 files/260 tests), project-wide `tsc --noEmit` clean, and human-verified classification values/card height/`/#gallery` scroll/other-surface spot-checks.

The only non-blocking item is a documentation-lag note: REQUIREMENTS.md's SBOX-09/HERO-05 checkboxes and Traceability status column were not updated to "Complete" in the same pass that updated ROADMAP.md — recommend closing that out alongside this phase's finalization commit.

---

*Verified: 2026-07-31T19:55:00Z*
*Verifier: Claude (gsd-verifier)*
