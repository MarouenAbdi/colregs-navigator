---
phase: 05-save-share-gallery
plan: 03
subsystem: ui
tags: [react, next.js, trpc, sandbox]

# Dependency graph
requires:
  - phase: 05-save-share-gallery
    provides: "trpc + TRPCReactProvider client entry point (05-01, src/lib/trpc/client.tsx)"
provides:
  - "SandboxContainer accepts optional initialScenario/banner props, seeding state and Reset from a saved/shared scenario instead of the hardcoded default (Assumption A3)"
  - "Working Save button: trpc.scenario.create.useMutation() -> router.push(/s/{shareId}) on success"
affects: [05-05 share page, 05-04 gallery page -- both will render SandboxContainer with initialScenario/banner]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "SandboxContainerProps.initialScenario/banner (src/components/sandbox/types.ts) is the fixed contract any Server/Client Component seeding the sandbox from a saved scenario must pass"
    - "seedA/seedB local consts (derived once from initialScenario ?? default fixture) are the single source of truth for both the initial useState value and handleReset's restore target -- no second hardcoded fixture reference anywhere in the component"

key-files:
  created: []
  modified: [src/components/sandbox/SandboxContainer.tsx, src/components/sandbox/SandboxContainer.test.tsx, src/components/sandbox/types.ts, tsconfig.json]

key-decisions:
  - "Switched tsconfig.json moduleResolution from NodeNext to bundler (module: esnext) -- NodeNext requires an exports map to resolve package subpaths, and next/navigation (Next.js's own package) ships without one. This is Next.js's own documented recommended tsconfig for this project shape and only affects the tsc --noEmit type-check layer (Next's bundler doesn't consult these fields for actual transpilation), so it's a safe superset change: every existing relative *.js-suffixed import still resolves identically."

patterns-established:
  - "Any component that needs to seed SandboxContainer from persisted data passes initialScenario={{ vesselA, vesselB }}; Reset restores THAT seed, not the app's unrelated default demo fixture"

requirements-completed: [SCEN-01]

# Metrics
duration: 12min
completed: 2026-07-18
---

# Phase 5 Plan 3: Seed SandboxContainer from Saved Scenarios + Wire Save Summary

**SandboxContainer now accepts `initialScenario`/`banner` props for the loaded-scenario path, and its Save button persists the current encounter via `scenario.create` and redirects to `/s/{shareId}` -- no login step, no second read-only rendering mode.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-07-18T01:19:00Z
- **Completed:** 2026-07-18T01:31:00Z
- **Tasks:** 2 completed
- **Files modified:** 4 (0 created, 4 modified)

## Accomplishments
- `SandboxContainer` accepts optional `initialScenario`/`banner` props (added to `types.ts`'s existing `*Props` convention) with zero change to any existing prop signature
- `seedA`/`seedB` locals replace every direct `crossingResidualBasicCase` reference inside the component body (initial `useState`, the lazy classification initializer, and `handleReset`) -- the plain `"/"` route's behavior is byte-for-byte unchanged since `seedA`/`seedB` fall back to that same fixture when `initialScenario` is absent
- An optional neutral-slate banner (`banner.label` + `banner.rationale`) renders below the header row when `banner` is provided (D-02)
- A working "Save" button next to "Reset Scenario", reusing the same `teal-600` CTA styling, calls `trpc.scenario.create.useMutation({ vesselA, vesselB })` and redirects to `/s/{shareId}` on success via `next/navigation`'s `useRouter`; disabled while the mutation is pending

## Task Commits

Each task was committed atomically:

1. **Task 1: Add initialScenario/banner props and seed-aware reset** - `e469e32` (feat)
2. **Task 2: Wire the Save button to scenario.create and redirect to the share URL** - `1538ca8` (feat, includes the tsconfig.json Rule 3 fix)

**Plan metadata:** commit pending (docs: complete plan) -- added immediately after this SUMMARY

_Note: both tasks were `tdd="true"`; each commit bundles the RED+GREEN work into a single `feat` commit per this project's existing 04-06 precedent (test file + implementation file changed together), since the plan's `<verify>` block runs the full test file as one gate rather than separate red/green sub-steps._

## Files Created/Modified
- `src/components/sandbox/types.ts` - added `SandboxContainerProps { initialScenario?, banner? }`
- `src/components/sandbox/SandboxContainer.tsx` - seedA/seedB derivation, banner rendering, Save button wired to `trpc.scenario.create.useMutation()` + `useRouter().push()`
- `src/components/sandbox/SandboxContainer.test.tsx` - 7 new tests (seed-from-scenario, seed-aware reset, banner label/rationale, Save mutate-args, Save redirect-on-success, Save disabled-while-pending) alongside the 5 pre-existing regression tests, all passing
- `tsconfig.json` - `moduleResolution`/`module` switched to `bundler`/`esnext` (see Deviations)

## Decisions Made
- Followed the plan's exact contract: `seedA`/`seedB` as the single derivation point, banner styled with the existing neutral-`slate-*` palette (not `teal-*`, reserved for primary actions per the file's own convention)
- For the Reset-restores-initialScenario test, moved the coincident-position drag target to `(0,0)` (vesselA's own seeded position, an exact integer) rather than the overtaking fixture's `(0.5, -0.8660254)`, to avoid floating-point round-trip precision noise through the screen<->chart pixel conversion in `dragHullTo` -- `bearing()`'s coincident check is an exact `dx === 0 && dy === 0` comparison, so the drag target needed to be bit-for-bit reproducible

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Switched tsconfig.json's moduleResolution from NodeNext to bundler**
- **Found during:** Task 2 verification (`npx tsc --noEmit`)
- **Issue:** `import { useRouter } from "next/navigation"` (this task's first bare `next/*` subpath import anywhere in the codebase) failed to resolve under `moduleResolution: "NodeNext"` with `TS2307: Cannot find module 'next/navigation'`, even though it resolves correctly at runtime (Vitest/Next's own bundler don't consult tsconfig's module-resolution fields for transpilation). Root cause: `NodeNext` requires a package to declare an `exports` map to resolve subpaths; Next.js's own `next` package (v16.2.10) does not declare one for its client-component subpaths (`navigation`, `link`, etc.), relying instead on classic/bundler-style file resolution.
- **Fix:** Changed `"module": "NodeNext"` / `"moduleResolution": "NodeNext"` to `"module": "esnext"` / `"moduleResolution": "bundler"` -- Next.js's own documented recommended tsconfig for this exact project shape (Context7 `/vercel/next.js/v16.2.2`, "migrating from Vite" reference config). Confirmed this is a strict superset: `bundler` resolution still supports the codebase's existing convention of writing relative imports with an explicit `.js` extension against `.ts`/`.tsx` source files (e.g. `"../../lib/trpc/client.js"`), so no other file needed to change.
- **Files modified:** `tsconfig.json`
- **Verification:** `npx tsc --noEmit` exits 0; full `npm test` suite (157/157 across 23 files) still passes unchanged
- **Committed in:** `1538ca8` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 3, blocking build-config fix, isolated to the type-checking layer).
**Impact on plan:** Necessary to satisfy this plan's own explicit `npx tsc --noEmit` verification gate; no runtime behavior change, no other file's imports affected.

## Issues Encountered
- Local worktree environment (same as 05-01/05-02): `generated/prisma` (gitignored) needed regenerating via `npx prisma generate` and a local `.env` (gitignored, copied from `.env.example`) was needed for the 3 pre-existing DB-backed router test files to pass against the shared dev Postgres container on port 5432. Neither is tracked; both are prerequisites for running this plan's own verification commands in a fresh worktree, not scope creep.

## User Setup Required

None - no external service configuration required beyond the pre-existing local Postgres dev setup already documented in `.env.example`.

## Next Phase Readiness
- `SandboxContainer`'s `initialScenario`/`banner` props (src/components/sandbox/types.ts) are the fixed contract Plan 05-05 (share page, `/s/[shareId]`) and Plan 05-04 (gallery page) will pass when rendering a loaded scenario.
- The Save -> `scenario.create` -> `/s/{shareId}` redirect flow is fully wired and tested; Plan 05-05's share page is the consumer of the resulting share URL.
- No blockers.

---
*Phase: 05-save-share-gallery*
*Completed: 2026-07-18*

## Self-Check: PASSED

- FOUND: src/components/sandbox/SandboxContainer.tsx
- FOUND: src/components/sandbox/SandboxContainer.test.tsx
- FOUND: src/components/sandbox/types.ts
- FOUND: tsconfig.json
- FOUND commit: e469e32
- FOUND commit: 1538ca8
