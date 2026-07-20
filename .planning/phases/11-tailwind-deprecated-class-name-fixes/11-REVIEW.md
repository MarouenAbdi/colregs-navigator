---
phase: 11-tailwind-deprecated-class-name-fixes
reviewed: 2026-07-20T07:13:31Z
depth: standard
files_reviewed: 7
files_reviewed_list:
  - eslint.config.mjs
  - src/components/gallery/GalleryCard.tsx
  - src/components/layout/Header.tsx
  - src/components/sandbox/ChartPanel.tsx
  - src/components/sandbox/SandboxContainer.tsx
  - src/components/ui/button.tsx
  - src/components/ui/select.tsx
findings:
  critical: 0
  warning: 0
  info: 1
  total: 1
status: clean
---

# Phase 11: Code Review Report

**Reviewed:** 2026-07-20T07:13:31Z
**Depth:** standard
**Files Reviewed:** 7
**Status:** clean

## Summary

Phase 11 is a deliberately narrow, mechanical Tailwind v3→v4 class-name migration
(`outline-none` → `outline-hidden` at 4 sites; `rounded-[0.25rem]` → `rounded-sm` at 2 sites)
plus one dead-config removal (`eslint.config.mjs`'s `enforce-canonical-classes` ignore
pattern, per D-03). I read all four commits that implement this phase
(`7622693`, `07d1efc`, `07cde6f`, `9e81a73`) plus the two plan files, two summaries, and the
locked CONTEXT.md decisions (D-01 through D-05), then independently re-verified every claim in
the summaries rather than trusting them:

- Confirmed `outline-none` and `rounded-[0.25rem]` no longer appear anywhere in `src/`
  (`grep -rn` exits 1 / no matches).
- Confirmed both false-positive traps are byte-identical: `GalleryPreviewChart.tsx:19`'s
  "rounded to clean numbers" comment and `Hero.tsx:72`'s "Grounded in " copy.
- Confirmed `select.tsx:56`'s unrelated `rounded-[min(var(--radius-md),10px)]` arbitrary radius
  is untouched, and that `select.tsx`'s pre-existing `outline-hidden` in `SelectItem` (line 160)
  predates this phase (not introduced by it — confirmed via `git log -p`), so it is not evidence
  of scope creep.
- Confirmed the a11y mitigation claimed in the plans actually holds: every renamed
  `outline-hidden` site (button.tsx, select.tsx, Header.tsx, GalleryCard.tsx) still carries an
  adjacent `focus-visible:ring-*`/`ring-offset-*` treatment in the same className string, so no
  visible keyboard-focus indicator is lost by this rename.
- Ran `npx eslint .` project-wide: 0 errors, 3 pre-existing unrelated `max-lines` warnings on
  domain files (already tracked in `eslint-suppressions.json` from Phase 10, untouched here).
  Ran `npx tsc --noEmit`: no output, clean.
- Confirmed `git show --stat` on all 4 phase commits touches exactly the 6 declared component
  files plus `eslint.config.mjs` — no scope creep into any other file.
- Confirmed the intermediate class-order/line-wrap reordering commit (`07cde6f`) is a pure
  whitespace/token-position change with no semantic or behavioral difference (verified via
  `git show` diff — only reflow, no class added/removed/changed).
- Confirmed `eslint.config.mjs`'s final diff matches D-03 exactly: only the `rules` key
  (containing the dead `enforce-canonical-classes` ignore pattern and its comment) was removed;
  `entryPoint: "app/globals.css"` and every other config block (Vitest, architecture-boundary,
  stale-ID-comments, raw-CSS, globalIgnores) is untouched.
- Grepped for other Tailwind v3-deprecated tokens that might have been missed in scope
  (`shadow-outline`, `flex-grow`/`flex-shrink`, `overflow-ellipsis`, `bg-opacity-*` etc.) —
  none found anywhere in `src/` or `app/`, so this phase's scope was complete for the deprecated
  classes it targeted.

No security concerns apply (presentational className-only change, no new data flow or trust
boundary). No bugs found in the 4 rename sites or the 2 radius sites. The one accepted visual
change (0.25rem → 0.375rem radius per D-01/D-02) is a locked decision, not a defect, and is
excluded from findings per this review's scope note.

One minor Info-level observation below — not a defect, but worth flagging for a future reader.

## Info

### IN-01: Pre-existing stale plan/decision-ID comments sit inside two files this phase touched, but were not addressed

**File:** `src/components/sandbox/SandboxContainer.tsx:12,175,239` and `src/components/sandbox/ChartPanel.tsx:5,14,391`
**Issue:** CLAUDE.md's documented comment convention states comments should "never reference a
task/plan ID that will rot once the plan is archived — reference the *reason* instead." Both
files this phase modified (`SandboxContainer.tsx` line 230, `ChartPanel.tsx` line 446) already
contain several comments referencing `D-01`/`D-02`/`D-04`/`VESL-02` — but these IDs belong to an
*earlier* phase's decision log (the chip-preset-row and drag-gesture work), not Phase 11's own
D-01–D-05. This is a naming collision (Phase 11's CONTEXT.md also defines its own D-01/D-02 for
the radius rename), which could confuse a future reader trying to trace "D-02" back to its
source. This is pre-existing content, not introduced by this phase's diff (confirmed via
`git show` — the phase's actual line-level changes are single-token `rounded-[0.25rem]` →
`rounded-sm` swaps only, not these comment blocks), and 11-CONTEXT.md's phase boundary
explicitly scoped this phase to class-name renames only, so leaving it alone was correct scope
discipline. Flagging only because both files were "touched" in this phase and a future
stale-ID-comment sweep should account for the cross-phase ID collision, not because this phase
introduced or was obligated to fix it.
**Fix:** No action required for Phase 11. When a future phase revisits `SandboxContainer.tsx`
or `ChartPanel.tsx`, consider rewording these comments to name the decision by its subject
(e.g. "the chip-preset hysteresis decision") rather than a bare `D-01`/`D-02` ID, per CLAUDE.md's
own convention, to avoid the cross-phase ambiguity.

---

_Reviewed: 2026-07-20T07:13:31Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
