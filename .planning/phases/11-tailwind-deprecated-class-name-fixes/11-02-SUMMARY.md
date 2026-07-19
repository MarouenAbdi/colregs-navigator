---
phase: 11-tailwind-deprecated-class-name-fixes
plan: 02
subsystem: tooling
tags: [eslint, tailwind-v4, config-cleanup]

# Dependency graph
requires:
  - phase: 11-01
    provides: "both rounded-[0.25rem] sites (SandboxContainer.tsx, ChartPanel.tsx) renamed to rounded-sm, making the eslint.config.mjs ignore pattern dead"
provides:
  - "eslint.config.mjs better-tailwindcss config block reduced to extends + settings only, no dead enforce-canonical-classes ignore pattern"
  - "confirmed project-wide npx eslint . stays lint-clean (0 errors) after the Plan 01 rename + this plan's config cleanup"
affects: [11-03]

# Tech tracking
tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified:
    - eslint.config.mjs

key-decisions:
  - "D-03 (CONTEXT.md): removed the now-dead better-tailwindcss/enforce-canonical-classes ignore pattern and its 9-line explanatory comment, now that rounded-[0.25rem] no longer exists anywhere in src/."
  - "Dropped the now-empty rules key from the better-tailwindcss config block entirely (smallest diff), rather than leaving rules: {} -- per 11-PATTERNS.md's noted style preference."

patterns-established: []

requirements-completed: [TWFX-02]

# Metrics
duration: 5min
completed: 2026-07-19
---

# Phase 11 Plan 02: ESLint Config Cleanup Summary

**Removed the now-dead `better-tailwindcss/enforce-canonical-classes` ignore pattern (and its comment) from `eslint.config.mjs`, then confirmed project-wide `npx eslint .` stays lint-clean.**

## Performance

- **Duration:** ~5 min
- **Completed:** 2026-07-19
- **Tasks:** 2/2 completed
- **Files modified:** 1

## Accomplishments
- Removed the 9-line explanatory comment and the `"better-tailwindcss/enforce-canonical-classes": ["warn", { ignore: ["^rounded-\\[0\\.25rem\\]$"] }]` rule line from `eslint.config.mjs`'s `better-tailwindcss` config block (D-03).
- Dropped the now-empty `rules` key from that block entirely, leaving only `extends` and `settings` (unchanged `entryPoint: "app/globals.css"`).
- Confirmed `node --check eslint.config.mjs` passes (valid syntax) and `grep -n "enforce-canonical-classes"` / `grep` for `rounded-\[0\.25rem\]` both return zero matches in the config file.
- Ran project-wide `npx eslint .`: exits 0, 0 errors, 3 pre-existing `max-lines` warnings on unrelated domain files (`classify-encounter.ts`, `.test.ts`, `.fixtures.ts` — already tracked in `eslint-suppressions.json` from Phase 10, untouched by this plan). No `better-tailwindcss/*` warnings on any of the 6 files touched in Plan 01 — confirms the config cleanup introduced zero regressions.

## Task Commits

1. **Task 1: Remove the dead rounded-[0.25rem] ignore pattern from eslint.config.mjs** - `9e81a73` (chore)
2. **Task 2: Run project-wide eslint as acceptance check** - verification-only, no code change, no commit (confirmed `npx eslint .` exits 0 with zero new errors/warnings)

## Files Created/Modified
- `eslint.config.mjs` - removed the dead `better-tailwindcss/enforce-canonical-classes` ignore pattern and its comment; dropped the now-empty `rules` key from that config block.

## Decisions Made
- D-03 (CONTEXT.md, pre-locked): remove the dead ignore pattern now that both `rounded-[0.25rem]` sites are gone from the codebase (Plan 01).
- Style call (per 11-PATTERNS.md's noted "either is lint-valid" guidance): dropped the `rules` key entirely rather than leaving `rules: {}`, for the smallest diff.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `eslint.config.mjs`'s `better-tailwindcss` block no longer carries stale config for a value that doesn't exist in the codebase.
- Project-wide lint remains clean (0 errors) after both the Plan 01 rename and this plan's cleanup.
- TWFX-04 (human browser verification of no visual/focus-ring regression) remains open, scoped to Plan 03 per CONTEXT.md D-05.
- No blockers.

---
*Phase: 11-tailwind-deprecated-class-name-fixes*
*Completed: 2026-07-19*
