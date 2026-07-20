---
quick_id: 260720-jko
type: quick
autonomous: true
files_modified:
  - src/components/sandbox/** (moved into chart/, control-panel/, instruments/, reasoning/, hooks/; SandboxContainer.tsx/.test.tsx, types.ts, vessel-role.ts/.test.ts, chip-scenarios.ts/.test.ts, environment.smoke.test.tsx stay at sandbox root)
  - src/domain/colregs/** (risk-of-collision, vessel-priority, resolve-doubt-geometry moved into their own subfolders; classify-encounter.*, types.ts stay at colregs root)
  - src/domain/geometry/** (angle-convert, bearing, cpa, relative-bearing, screen-convert each moved into their own subfolder)
  - src/components/gallery/** (GalleryCard moved into card/, GalleryPreviewChart + gallery-preview-geometry moved into chart/; GalleryContainer.tsx/.test.tsx stay at gallery root)
  - every file across src/ and app/ that imports any moved file (import paths updated)
---

<objective>
Reorganize 4 flat directories (sandbox, domain/colregs, domain/geometry, gallery) into topic/feature subfolders so each directory reads as a small set of labeled clusters instead of one big alphabetical file list. Pure file-organization refactor -- zero logic/behavior change. Every moved file keeps its content byte-identical except for updated relative import paths (this repo's `.js`-suffix-pointing-at-`.ts` convention, locked in Phase 1).

User-confirmed scope (via AskUserQuestion):
- domain/geometry IS included (same flat function+fixtures+test-per-file problem as colregs), even though CLAUDE.md's tech-stack research documented `src/domain/` as intentionally flat -- user explicitly overrode that for this task.
- gallery gets a light split only (card/, chart/) with GalleryContainer staying at gallery root as the top-level composition; not a full breakdown given it's only 8 files.

Purpose: improve navigability of the codebase's largest/most mixed directories ahead of using this project as an interview/portfolio artifact.
Output: 4 directories reorganized into feature subfolders, all import paths updated, zero test/typecheck/lint regression.
</objective>

<context>
Current branch: gsd/phase-13-comment-cleanup (no new branch -- quick_branch_template is null, stays on current branch per init).
Phase 13 (comment cleanup) is fully committed on this branch, pending a separate human sign-off unrelated to this task. Do not touch .planning/ tracking files for Phase 13.
This codebase has a documented history of 2 prior hit-testing regressions from structural moves around VesselGroup.tsx (Phase 4, Phase 8) -- the fix pattern was always "attach handlers to the real painted shape, not a proxy," which this reorg does not touch (VesselGroup.tsx moves as a file, its internal content is untouched). Still, verify after every directory.
</context>

<tasks>

<task type="auto">
  <name>Task 1: Reorganize src/components/sandbox/ into feature subfolders</name>
  <files>All files in src/components/sandbox/ and src/components/sandbox/hooks/, plus every file elsewhere in src/ and app/ that imports from src/components/sandbox/</files>
  <action>
Create these new subfolders under src/components/sandbox/ and `git mv` each file into place (preserving history):

**chart/** (chart rendering + geometry):
- ChartPanel.tsx, ChartPanel.test.tsx
- ChartBackdrop.tsx
- VesselGroup.tsx
- chart-panel-geometry.ts, chart-panel-geometry.test.ts
- chart-panel-derivation.ts, chart-panel-derivation.test.ts

**control-panel/** (vessel input form):
- ControlPanel.tsx, ControlPanel.test.tsx
- CopyLinkButton.tsx

**instruments/** (readout tiles + status pill):
- InstrumentReadouts.tsx, InstrumentReadouts.test.tsx
- instrument-readouts.ts, instrument-readouts.test.ts
- status-pill.ts, status-pill.test.ts
(NOTE: `InstrumentReadouts.tsx`/`instrument-readouts.ts` differ only by case -- on a case-INsensitive filesystem (default macOS), `git mv` both to the SAME target directory in the SAME command batch, or as two immediately-sequential `git mv` calls, to avoid a transient collision. Verify both files exist with correct distinct content after the move via `ls -la src/components/sandbox/instruments/`.)

**reasoning/** (verdict + reasoning trail display):
- ReasoningTrail.tsx, ReasoningTrail.test.tsx
- VerdictBanner.tsx, VerdictBanner.test.tsx
- reasoning-trail-tag.ts, reasoning-trail-tag.test.ts

**hooks/** (already exists -- add the container's own state hook alongside the drag hooks already there):
- useSandboxState.ts (move in from sandbox root; useContainerSize.ts, useHullDrag.ts/.test.ts, useRotateHandleDrag.ts/.test.ts already live here, leave them as-is)

**Stays at src/components/sandbox/ root** (top-level composition + shared cross-cutting types, no move needed):
- SandboxContainer.tsx, SandboxContainer.test.tsx
- types.ts
- vessel-role.ts, vessel-role.test.ts
- chip-scenarios.ts, chip-scenarios.test.ts
- environment.smoke.test.tsx

After all moves, update every import statement across the codebase referencing a moved file's old path:
1. Find every file importing from the OLD sandbox paths: `grep -rl "components/sandbox/\(ChartPanel\|ChartBackdrop\|VesselGroup\|chart-panel-geometry\|chart-panel-derivation\|ControlPanel\|CopyLinkButton\|InstrumentReadouts\|instrument-readouts\|status-pill\|ReasoningTrail\|VerdictBanner\|reasoning-trail-tag\|hooks/useSandboxState\)" src/ app/ --include='*.ts' --include='*.tsx'`
2. Also check for relative imports FROM WITHIN sandbox files themselves to their now-moved siblings (e.g. SandboxContainer.tsx importing `./hooks/useSandboxState.js` needs no change since useSandboxState.ts moved INTO hooks/ where the import already points; but ChartPanel.tsx importing `./types.js` now needs `../types.js` since ChartPanel moved down one level into chart/).
3. Update every relative import path to reflect the new file locations (adjust `../` depth as needed for cross-subfolder references, e.g. a file in `chart/` importing `types.ts` at sandbox root needs `../types.js`, not `./types.js`).
4. Do NOT change any import that already points outside src/components/sandbox/ (e.g. `../../domain/colregs/...`, `@/components/ui/...`) except to adjust the leading `../` count if the importing file's own depth changed.
  </action>
  <verify>
    <automated>npx vitest run && npm run typecheck && npm run lint</automated>
  </verify>
  <done>All sandbox files moved into chart/, control-panel/, instruments/, reasoning/, hooks/ (or left at sandbox root per the list above); every import path across the codebase updated; full test suite passes with the same 216 pass count; typecheck and lint both clean (0 errors); commit created.</done>
</task>

<task type="auto">
  <name>Task 2: Reorganize src/domain/colregs/ into per-rule subfolders</name>
  <files>All files in src/domain/colregs/, plus every file elsewhere in src/ and app/ that imports from src/domain/colregs/</files>
  <action>
Create these new subfolders under src/domain/colregs/ and `git mv` each file into place:

**risk-of-collision/**:
- risk-of-collision.ts, risk-of-collision.fixtures.ts, risk-of-collision.test.ts

**vessel-priority/**:
- vessel-priority.ts, vessel-priority.fixtures.ts, vessel-priority.test.ts

**doubt-geometry/**:
- resolve-doubt-geometry.ts, resolve-doubt-geometry.fixtures.ts, resolve-doubt-geometry.test.ts

**Stays at src/domain/colregs/ root** (top-level dispatcher composing all the above + shared types):
- classify-encounter.ts, classify-encounter.fixtures.ts, classify-encounter.test.ts
- types.ts

Update every import statement across the codebase referencing a moved file's old path:
1. Find every file importing from the OLD colregs paths: `grep -rl "domain/colregs/\(risk-of-collision\|vessel-priority\|resolve-doubt-geometry\)" src/ app/ --include='*.ts' --include='*.tsx'`
2. Update classify-encounter.ts's own internal imports of risk-of-collision.js/vessel-priority.js/resolve-doubt-geometry.js (it now needs `./risk-of-collision/risk-of-collision.js` etc., not `./risk-of-collision.js`).
3. Update every relative import path elsewhere in the codebase (server layer, sandbox components, hero/gallery preview charts) that imports classify-encounter.ts's siblings directly, if any do.
  </action>
  <verify>
    <automated>npx vitest run && npm run typecheck && npm run lint</automated>
  </verify>
  <done>risk-of-collision, vessel-priority, resolve-doubt-geometry each moved into their own subfolder with fixtures+test; classify-encounter.* and types.ts stay at colregs root; every import path updated; full test suite passes with the same 216 pass count; typecheck and lint both clean; commit created.</done>
</task>

<task type="auto">
  <name>Task 3: Reorganize src/domain/geometry/ into per-function subfolders</name>
  <files>All files in src/domain/geometry/, plus every file elsewhere in src/ and app/ that imports from src/domain/geometry/</files>
  <action>
Create these new subfolders under src/domain/geometry/ and `git mv` each file into place (every one of these 5 functions currently has exactly 3 files: implementation, fixtures, test):

**angle-convert/**: angle-convert.ts, angle-convert.fixtures.ts, angle-convert.test.ts
**bearing/**: bearing.ts, bearing.fixtures.ts, bearing.test.ts
**cpa/**: cpa.ts, cpa.fixtures.ts, cpa.test.ts
**relative-bearing/**: relative-bearing.ts, relative-bearing.fixtures.ts, relative-bearing.test.ts
**screen-convert/**: screen-convert.ts, screen-convert.fixtures.ts, screen-convert.test.ts

Nothing stays at src/domain/geometry/ root -- unlike colregs, geometry has no single top-level dispatcher file; each of the 5 functions is independently imported by different consumers (cpa.ts by risk-of-collision, bearing.ts + relative-bearing.ts by classify-encounter, screen-convert.ts by ChartPanel/gallery/hero preview charts, angle-convert.ts by relative-bearing). Delete the now-empty src/domain/geometry/ directory listing (it will simply contain only the 5 new subfolders).

Update every import statement across the codebase referencing a moved file's old path:
1. Find every file importing from the OLD geometry paths: `grep -rl "domain/geometry/\(angle-convert\|bearing\|cpa\|relative-bearing\|screen-convert\)" src/ app/ --include='*.ts' --include='*.tsx'`
2. This includes cross-references WITHIN geometry itself (e.g. relative-bearing.ts importing angle-convert.js needs `../angle-convert/angle-convert.js`, not `./angle-convert.js`) and every consumer outside geometry/ (domain/colregs/*, sandbox chart files, hero/gallery preview-geometry files, server layer if any).
3. Update every relative import path accordingly.
  </action>
  <verify>
    <automated>npx vitest run && npm run typecheck && npm run lint</automated>
  </verify>
  <done>All 5 geometry functions (angle-convert, bearing, cpa, relative-bearing, screen-convert) each moved into their own subfolder with fixtures+test; every import path across the whole codebase updated; full test suite passes with the same 216 pass count; typecheck and lint both clean; commit created.</done>
</task>

<task type="auto">
  <name>Task 4: Light-split src/components/gallery/ into card/ and chart/</name>
  <files>All files in src/components/gallery/, plus every file elsewhere in src/ and app/ that imports from src/components/gallery/</files>
  <action>
Create these new subfolders under src/components/gallery/ and `git mv` each file into place:

**card/**:
- GalleryCard.tsx, GalleryCard.test.tsx

**chart/**:
- GalleryPreviewChart.tsx, GalleryPreviewChart.test.tsx
- gallery-preview-geometry.ts, gallery-preview-geometry.test.ts

**Stays at src/components/gallery/ root** (top-level composition):
- GalleryContainer.tsx, GalleryContainer.test.tsx

Update every import statement across the codebase referencing a moved file's old path:
1. Find every file importing from the OLD gallery paths: `grep -rl "components/gallery/\(GalleryCard\|GalleryPreviewChart\|gallery-preview-geometry\)" src/ app/ --include='*.ts' --include='*.tsx'`
2. Update GalleryContainer.tsx's own import of GalleryCard.js (now `./card/GalleryCard.js`, not `./GalleryCard.js`).
3. Update GalleryCard.tsx's own import of GalleryPreviewChart.js if it imports it directly (now `../chart/GalleryPreviewChart.js`).
4. Update every other relative import path accordingly.
  </action>
  <verify>
    <automated>npx vitest run && npm run typecheck && npm run lint</automated>
  </verify>
  <done>GalleryCard moved into card/, GalleryPreviewChart + gallery-preview-geometry moved into chart/; GalleryContainer stays at gallery root; every import path updated; full test suite passes with the same 216 pass count; typecheck and lint both clean; commit created.</done>
</task>

</tasks>

<verification>
After all 4 tasks: run `npx vitest run` (full suite, no path filter), `npm run typecheck`, and `npm run lint` one final time to confirm the combined result is clean. Run `find src/components/sandbox src/domain/colregs src/domain/geometry src/components/gallery -type f | sort` and visually confirm the new structure matches the plan. Run `git log --oneline -10` and confirm 4 atomic commits (one per task/directory), each using `git mv` (verify via `git show --stat` that files show as renames, not delete+add pairs, wherever git's similarity heuristic detects them as such).
</verification>

<success_criteria>
All 4 directories (sandbox, domain/colregs, domain/geometry, gallery) are reorganized into feature subfolders per the plan above. Zero logic/behavior change -- full test suite (216/216), typecheck, and lint all pass identically to the pre-reorg baseline. Every file move used `git mv` where git could detect it, preserving blame history. 4 atomic commits, one per directory.
</success_criteria>

<output>
Create `.planning/quick/260720-jko-reorganize-flat-component-domain-directo/260720-jko-SUMMARY.md` when done.
</output>
