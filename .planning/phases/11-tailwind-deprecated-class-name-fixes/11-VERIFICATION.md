---
phase: 11-tailwind-deprecated-class-name-fixes
verified: 2026-07-20T08:30:00Z
status: passed
score: 8/8 must-haves verified
overrides_applied: 0
---

# Phase 11: Tailwind Deprecated Class-Name Fixes Verification Report

**Phase Goal:** All known deprecated Tailwind v3 class-name usages are replaced with their Tailwind v4 canonical equivalents, with no visual or accessibility regression.
**Verified:** 2026-07-20T08:30:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `outline-none` no longer appears in `button.tsx`, `select.tsx`, `Header.tsx`, `GalleryCard.tsx` | VERIFIED | `grep -rn "outline-none"` across the 4 files returns zero matches (exit 1). Each now carries `outline-hidden`/`focus-visible:outline-hidden` exactly once. |
| 2 | `rounded-[0.25rem]` no longer appears anywhere in the codebase (D-01) | VERIFIED | `grep -rn "rounded-\[0.25rem\]" src/` returns zero matches (exit 1). Confirmed via project-wide grep, not just the 2 named files. |
| 3 | 0.25rem -> 0.375rem radius increase on SandboxContainer.tsx/ChartPanel.tsx accepted, not rolled back (D-02) | VERIFIED | Both files contain `rounded-sm` (line 230 and 446 respectively); no compensating arbitrary-value override present; `app/globals.css` confirms `--radius-sm = calc(var(--radius) * 0.6)` = 0.375rem with `--radius: 0.625rem`. |
| 4 | `select.tsx` line 56's unrelated `rounded-[min(var(--radius-md),10px)]` is byte-identical to before | VERIFIED | Line 56 still reads `data-[size=sm]:h-7 data-[size=sm]:rounded-[min(var(--radius-md),10px)]`, untouched. |
| 5 | False-positive trap sites (`GalleryPreviewChart.tsx` comment, `Hero.tsx` copy) are byte-identical | VERIFIED | `GalleryPreviewChart.tsx:19` still contains "rounded to clean numbers"; `Hero.tsx:72` still contains `"Grounded in "` UI copy. |
| 6 | `eslint.config.mjs` no longer contains the dead `rounded-[0.25rem]` ignore pattern (D-03) | VERIFIED | `grep -n "enforce-canonical-classes" eslint.config.mjs` returns zero matches (exit 1); the better-tailwindcss config block now contains only `extends` + `settings` (entryPoint unchanged); `node --check` confirms valid syntax. |
| 7 | Project-wide lint stays clean after rename + config cleanup | VERIFIED | `npx eslint .` exits 0; only 3 pre-existing, unrelated `max-lines` warnings on domain test/fixture files (tracked from Phase 10), zero `better-tailwindcss/*` warnings on any of the 6 touched files, zero errors. `npx tsc --noEmit` also clean (no output). |
| 8 | A human confirms in a real browser that Hero, Header, Gallery, Sandbox show no visual/keyboard-focus regression (TWFX-04) | VERIFIED | 11-03-SUMMARY.md records the checkpoint task as `autonomous: false`, human resume-signal "approved" received, all 4 areas confirmed on first pass. Per task instructions, this recorded approval is treated as satisfying evidence and is not re-requested here. |

**Score:** 8/8 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/components/ui/button.tsx` | `outline-hidden` present, adjacent focus-visible ring intact | VERIFIED | Line 11 (cva template): `whitespace-nowrap outline-hidden transition-all select-none` immediately followed by `focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50`. |
| `src/components/ui/select.tsx` | `outline-hidden` on SelectTrigger, line 56 untouched | VERIFIED | Line 48: `outline-hidden transition-colors select-none` + adjacent `focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50`. A second `outline-hidden` exists on `SelectItem` (line ~160) but `git log -p` confirms it predates this phase (introduced in commit `0f96a3d`, Phase 8) — not scope creep. |
| `src/components/layout/Header.tsx` | `focus-visible:outline-hidden` on nav links | VERIFIED | Line 78 (of the multi-line className): `focus-visible:outline-hidden`, adjacent to `focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background`. |
| `src/components/gallery/GalleryCard.tsx` | `focus-visible:outline-hidden` on card link wrapper | VERIFIED | className: `focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden`. |
| `src/components/sandbox/SandboxContainer.tsx` | `rounded-sm` on save-status banner | VERIFIED | Line 230: `rounded-sm border border-border bg-card px-3 py-2 text-sm`. |
| `src/components/sandbox/ChartPanel.tsx` | `rounded-sm` on chart SVG border | VERIFIED | Line 446: `className="rounded-sm border border-border bg-chart-surface"`. |
| `eslint.config.mjs` | better-tailwindcss block reduced to `extends` + `settings` only | VERIFIED | Block at lines 37-46 contains only `extends: [eslintPluginBetterTailwindcss.configs.recommended]` and `settings["better-tailwindcss"].entryPoint`; no `rules` key, no dead ignore pattern. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `button.tsx` (`outline-hidden`) | `focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50` | same className string, adjacent | WIRED | Confirmed adjacent in the cva template literal. |
| `select.tsx` (`outline-hidden`) | `focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50` | same className string, adjacent | WIRED | Confirmed adjacent in SelectTrigger className. |
| `Header.tsx` (`focus-visible:outline-hidden`) | `focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background` | same className string, adjacent | WIRED | Confirmed adjacent on nav link anchor. |
| `GalleryCard.tsx` (`focus-visible:outline-hidden`) | `focus-visible:ring-2 focus-visible:ring-ring` | same className string, adjacent | WIRED | Confirmed adjacent on Link wrapper. |
| `eslint.config.mjs` better-tailwindcss block | `app/globals.css` entryPoint setting | `settings["better-tailwindcss"].entryPoint` | WIRED | `entryPoint: "app/globals.css"` unchanged after cleanup. |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| No deprecated class names remain in target files | `grep -rn "outline-none" <4 files>` | exit 1, no matches | PASS |
| No deprecated radius class remains anywhere | `grep -rn "rounded-\[0.25rem\]" src/` | exit 1, no matches | PASS |
| Project-wide lint clean | `npx eslint .` | 0 errors, 3 pre-existing unrelated warnings, exit 0 | PASS |
| Type safety unaffected | `npx tsc --noEmit` | no output, clean | PASS |
| Config syntax valid | `node --check eslint.config.mjs` | exit 0 | PASS |
| Scope discipline (no other files touched) | `git status --short` (working tree) | clean, all phase 11 commits already landed | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| TWFX-01 | 11-01 | `outline-none` -> `outline-hidden` in 4 files | SATISFIED | Truth #1, Artifacts table |
| TWFX-02 | 11-01, 11-02 | `rounded-[0.25rem]` -> `rounded-sm` in 2 files + dead config cleanup | SATISFIED | Truths #2, #3, #6, Artifacts table |
| TWFX-03 | 11-01 | Hand-applied, file-by-file, false-positive traps untouched | SATISFIED | Truths #4, #5 |
| TWFX-04 | 11-03 | Human confirms no visual/focus regression | SATISFIED | Truth #8, per 11-03-SUMMARY.md recorded approval (task instruction: treat as satisfied, not re-request) |

**Note on REQUIREMENTS.md bookkeeping:** `.planning/REQUIREMENTS.md` still shows TWFX-04 as an unchecked `[ ]` checkbox and the traceability table marks it "Pending," even though 11-03-SUMMARY.md and 11-03-PLAN.md's `requirements-completed: [TWFX-04]` frontmatter both confirm the human-verify checkpoint was completed and approved. This is a documentation-sync gap, not a code or process failure — the checkbox should be ticked and the traceability row updated to "Complete" as part of closing this phase, but it does not affect the phase goal, which is independently verified above through code inspection and the recorded human approval.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `.planning/REQUIREMENTS.md` | 26, 85 | TWFX-04 checkbox/traceability row not updated to reflect completed+approved status | Info | Documentation staleness only; does not affect codebase truth. Recommend updating as part of phase closure. |

No debt markers (`TBD`/`FIXME`/`XXX`/`TODO`/`HACK`/`PLACEHOLDER`) found in any of the 7 files modified by this phase. No stub patterns, no empty implementations, no hardcoded-empty props (this phase is a pure className-token rename with no new render logic).

### Human Verification Required

None. TWFX-04's human-verify checkpoint was already completed and approved per 11-03-SUMMARY.md (recorded resume-signal: "approved," all 4 areas confirmed on first pass), consistent with this task's explicit instruction not to re-request it.

### Gaps Summary

No gaps found. All 4 roadmap success criteria and all 4 requirement IDs (TWFX-01 through TWFX-04) are independently verified against the actual codebase:

- Both deprecated class-name renames (`outline-none` -> `outline-hidden`, `rounded-[0.25rem]` -> `rounded-sm`) are confirmed present at all 6 intended sites and absent everywhere else in `src/`.
- Both confirmed false-positive traps and the one unrelated arbitrary-value class are confirmed byte-identical to their pre-phase state.
- The dead eslint ignore pattern (D-03) is removed, and project-wide lint/typecheck remain clean.
- Each `outline-hidden` site retains its adjacent `focus-visible:ring-*` treatment, preserving keyboard-focus visibility (the accessibility risk this phase's threat model flagged).
- Human sign-off for TWFX-04 is on record and not contradicted by anything in the codebase.

The only finding is a minor documentation-sync issue (REQUIREMENTS.md checkbox not ticked for TWFX-04) — logged as Info-level, does not block phase completion.

---

*Verified: 2026-07-20T08:30:00Z*
*Verifier: Claude (gsd-verifier)*
