---
phase: 19-guided-tour
fixed_at: 2026-07-27T11:22:37Z
review_path: .planning/phases/19-guided-tour/19-REVIEW.md
iteration: 1
findings_in_scope: 5
fixed: 5
skipped: 0
status: all_fixed
---

# Phase 19: Code Review Fix Report

**Fixed at:** 2026-07-27T11:22:37Z
**Source review:** .planning/phases/19-guided-tour/19-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 5 (fix_scope: critical_warning -- CR-01, WR-01, WR-02, WR-03, WR-04; IN-01/IN-02 out of scope)
- Fixed: 5
- Skipped: 0

## Fixed Issues

### CR-01: Dialog open/close animation classes never match Radix's actual `data-state` attribute — dead CSS

**Files modified:** `src/components/ui/dialog.tsx`
**Commit:** 672a3d6
**Applied fix:** Replaced the bare `data-open:`/`data-closed:` Tailwind v4 boolean-attribute variants (which compile to `[data-open]`/`[data-closed]` selectors Radix never sets) with `data-[state=open]:`/`data-[state=closed]:` attribute-value variants on both `DialogOverlay` and `DialogContent`, matching Radix's actual `data-state="open"|"closed"` output. `select.tsx` shares the identical defect but is out of this finding's file scope (review explicitly calls it a "follow-up"), so it was left untouched.

### WR-01: Decorative tour illustrations are not hidden from assistive technology

**Files modified:** `src/components/tour/TourStepIllustration.tsx`
**Commit:** 23fe79e
**Applied fix:** Added `aria-hidden="true"` to all six `<svg>` roots (`WelcomeIllustration`, `MoveVesselsIllustration`, `InstrumentsIllustration`, `VerdictIllustration`, `ReasoningIllustration`, `GalleryIllustration`) so their fabricated `<text>` readout/verdict content is no longer announced by screen readers as live data.

### WR-02: `radar-sweep-dot` infinite animation is not gated behind `prefers-reduced-motion`

**Files modified:** `app/globals.css`
**Commit:** 727b936
**Applied fix:** Moved the `animation: radar-sweep 2s linear infinite;` declaration out of the base `.radar-sweep-dot` rule and into a `@media (prefers-reduced-motion: no-preference)` block, following the existing precedent set by the `html { scroll-behavior: smooth }` rule earlier in the same file.

### WR-04: `VerdictIllustration`'s "GIVE WAY" badge uses the wrong color, contradicting the app's actual give-way token

**Files modified:** `src/components/tour/TourStepIllustration.tsx`
**Commit:** 7804901
**Applied fix:** Changed the GIVE WAY badge's fill/stroke/text colors from amber (`#F59E0B`-based, this app's `--doubt` token) to the give-way red token values (`fill="rgba(239,68,68,.14)"`, `stroke="rgba(239,68,68,.4)"`, text `fill="#EF4444"`), matching the red wedge already used on the same vessel row and the real app's `--give-way` styling. Also updated the adjacent step-3 comment ("GIVE WAY (amber)" -> "GIVE WAY (red)") to stop documenting the now-fixed wrong color.

### WR-03: Duplicated near-identical JSX for the two-vessel blocks, violating CLAUDE.md's explicit convention

**Files modified:** `src/components/tour/TourStepIllustration.tsx`
**Commit:** bea7cbe
**Applied fix:** Extracted two parameterized subcomponents: `VesselWedge({ x, y, rotation, fill })` for `WelcomeIllustration`'s two vessel wedges, and `VerdictVesselRow({ y, label, wedgeFill, badgeFill, badgeStroke, badgeTextFill, badgeText })` for `VerdictIllustration`'s two vessel rows (rect + wedge + label + badge). Both call sites now pass only the per-vessel-varying values (position/rotation/color/label/text) instead of duplicating the full JSX block. Applied after the WR-04 color fix, so `VerdictVesselRow`'s Vessel A call site already uses the corrected red badge values. Updated the file's header comment to acknowledge the convention applies at the per-vessel grain within a step, not just across steps.

## Skipped Issues

None — all in-scope findings were fixed.

---

_Fixed: 2026-07-27T11:22:37Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
