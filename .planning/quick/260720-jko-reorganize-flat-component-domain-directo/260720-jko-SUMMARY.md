---
quick_id: 260720-jko
status: complete
completed: 2026-07-20
---

# Quick Task 260720-jko: Reorganize flat directories into topic subfolders Summary

**Split 4 flat directories (sandbox: 36 files, domain/colregs: 13 files, domain/geometry: 15 files, gallery: 8 files) into topic/feature subfolders — zero logic/behavior change, 216/216 tests pass throughout.**

## Performance

- **Duration:** ~25 min
- **Tasks:** 4 (one per directory)
- **Files touched:** ~90 (moves + import-path updates)

## Accomplishments

**sandbox/** → `chart/`, `control-panel/`, `instruments/`, `reasoning/`, `hooks/` (existing) — `SandboxContainer.tsx`, `types.ts`, `vessel-role.ts`, `chip-scenarios.ts`, `environment.smoke.test.tsx` stay at root as the top-level composition + shared types.

**domain/colregs/** → `risk-of-collision/`, `vessel-priority/`, `doubt-geometry/` — `classify-encounter.*` and `types.ts` stay at root as the top-level dispatcher.

**domain/geometry/** → `angle-convert/`, `bearing/`, `cpa/`, `relative-bearing/`, `screen-convert/` — no root-level dispatcher (each function is independently consumed). This reverses CLAUDE.md's tech-stack research decision that `src/domain/` stays flat; explicit user override confirmed via AskUserQuestion before executing.

**gallery/** → light split into `card/` (GalleryCard) and `chart/` (GalleryPreviewChart + gallery-preview-geometry) — `GalleryContainer.*` stays at root.

Every file move used `git mv`; git detected all as renames (preserving blame history). Every relative import path across the codebase was updated, including internal cross-references whose depth changed, plus `eslint-suppressions.json` was rekeyed to the new paths (not blanket re-suppressed — verified each moved suppression was a pre-existing entry, not a new issue).

## Task Commits

1. **Task 1: sandbox/** → `chart/`, `control-panel/`, `instruments/`, `reasoning/` - `81c0c7e`
2. **Task 2: domain/colregs/** → `risk-of-collision/`, `vessel-priority/`, `doubt-geometry/` - `7101e8c`
3. **Task 3: domain/geometry/** → `angle-convert/`, `bearing/`, `cpa/`, `relative-bearing/`, `screen-convert/` - `92c7083`
4. **Task 4: gallery/** → `card/`, `chart/` - `a02654e`

## Issues Encountered

Import-path depth tracking across 4 sequential moves (each subfolder adds one level, some files were already 1-2 levels deep before the move, some cross-references point to siblings that moved together vs. siblings that stayed at root) produced several rounds of sed-pattern misses and one over-correction, all caught by `npx vitest run`'s module-resolution errors (Vite fails loudly and precisely on any bad relative import) before any commit:

- Task 1: missed `ChartPanel.tsx`'s own `./hooks/*` imports (needed `../hooks/*` after moving into `chart/`) and `VesselGroup.tsx`'s same pattern.
- Task 3: a sed pattern anchored on `.js` only (not `.fixtures.js`/`.test.js`) missed several fixtures-file imports; required a broader single pattern to catch all three suffix variants.
- Task 4: a depth-bump sed pattern (`../../X` → `../../../X`) was applied a second time on top of an already-correct 1-level bump from a prior pass, over-correcting `sandbox/`/`shared/` references by one extra level while `domain/` references (which genuinely needed the extra level) were correct — caught immediately by the next test run and fixed by re-deriving each path's correct depth from first principles (`git show HEAD:<original-file>` to see the pre-move import) rather than continuing to pattern-match blindly.

Each issue was caught by `npx vitest run` before any commit — no broken state was ever committed.

`npm run typecheck` also required `npx prisma generate` in one context earlier in the session (unrelated to this task, a pre-existing worktree/env gap) but was clean throughout this quick task on the main checkout.

## Next Phase Readiness

All 4 target directories reorganized. Final verification: `npx vitest run` (216/216), `npm run typecheck` (0 errors), `npm run lint` (0 errors, 3 pre-existing unrelated `max-lines` warnings). `eslint-suppressions.json` correctly rekeyed throughout — no blanket re-suppression, every entry traced back to its pre-existing count under the old path.

---
*Quick task: 260720-jko*
*Completed: 2026-07-20*
