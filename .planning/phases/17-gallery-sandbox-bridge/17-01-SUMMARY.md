---
phase: 17-gallery-sandbox-bridge
plan: 01
subsystem: ui
tags: [react, context, nextjs, sandbox, gallery, bridge]

# Dependency graph
requires:
  - phase: 16-sandbox-mutation-path-generalization
    provides: "useSandboxState().loadScenario(vesselA, vesselB) — the single generalized full-replace + hysteresis-reset entry point every mutation source funnels through"
provides:
  - "SandboxBridgeProvider.tsx (Context + Provider + useSandboxBridge() hook) — the page-scoped Gallery->Sandbox signaling channel"
  - "app/page.tsx and app/s/[shareId]/page.tsx both wrapping their SandboxContainer render in SandboxBridgeProvider"
  - "SandboxContainer.tsx consuming useSandboxBridge() and applying pending scenarios via loadScenario(), keyed on requestId"
affects: [17-02-gallery-card-wiring, 17-04-end-to-end-verification]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "React Context Provider composed one level above two client subtrees on the same Server-rendered page, avoiding prop-drilling through a Server Component tree without Zustand (ARCHITECTURE.md Pattern 2)"
    - "requestId keyed off Date.now() (not payload object identity) so re-selecting an identical payload still re-triggers a consuming useEffect"

key-files:
  created:
    - src/components/sandbox/bridge/SandboxBridgeProvider.tsx
  modified:
    - app/page.tsx
    - app/s/[shareId]/page.tsx
    - src/components/sandbox/SandboxContainer.tsx
    - src/components/sandbox/SandboxContainer.test.tsx

key-decisions:
  - "useEffect in SandboxContainer is keyed only on pendingScenario?.requestId, deliberately excluding sandboxState.loadScenario from the dependency array — loadScenario is a plain function re-created every render (not memoized), so including it would re-fire the effect on every render rather than only on genuine new bridge requests"

patterns-established:
  - "Page-scoped bridge Context: a 'use client' Provider wrapping {children} one level above two client subtrees, mirroring app/layout.tsx's TRPCReactProvider composition shape exactly"

requirements-completed: [GAL-05]

duration: ~15min
completed: 2026-07-25
---

# Phase 17 Plan 01: Gallery -> Sandbox Bridge Infrastructure Summary

**SandboxBridgeProvider (React Context, no Zustand) lets any client leaf signal "load this scenario" into SandboxContainer via useSandboxBridge().requestLoad(), wired into both app/page.tsx and app/s/[shareId]/page.tsx and consumed by SandboxContainer's loadScenario()-calling effect.**

## Performance

- **Duration:** ~15 min
- **Completed:** 2026-07-25
- **Tasks:** 3
- **Files modified:** 5 (1 created, 4 modified)

## Accomplishments
- Built `SandboxBridgeProvider`/`useSandboxBridge()` — the exact contract from the plan's `<interfaces>` block, throwing when used outside the Provider
- Wrapped both `app/page.tsx` (Home) and `app/s/[shareId]/page.tsx` (SharedScenarioPage) in the Provider so `SandboxContainer`'s unconditional `useSandboxBridge()` call never throws on either route
- Wired `SandboxContainer` to call `sandboxState.loadScenario(vesselA, vesselB)` whenever `pendingScenario.requestId` changes, proven by two new component tests (single bridged load, and a second load replacing the first)

## Task Commits

1. **Task 1: Create SandboxBridgeProvider.tsx** - `9848cec` (feat)
2. **Task 2: Wrap both SandboxContainer-rendering routes in SandboxBridgeProvider** - `b6bf63a` (feat)
3. **Task 3: Wire SandboxContainer to consume the bridge via loadScenario, and prove it with tests** - `deb8784` (feat)

_Note: no `docs: complete plan` metadata commit in worktree mode — SUMMARY.md is committed separately per worktree protocol._

## Files Created/Modified
- `src/components/sandbox/bridge/SandboxBridgeProvider.tsx` - New Context + Provider + `useSandboxBridge()` hook; `PendingScenario` type; `requestLoad()` keyed off `Date.now()`
- `app/page.tsx` - Wraps Hero/Sandbox/Gallery in `SandboxBridgeProvider`
- `app/s/[shareId]/page.tsx` - Wraps `SandboxContainer`/`CopyLinkButton` in `SandboxBridgeProvider`
- `src/components/sandbox/SandboxContainer.tsx` - Added `useSandboxBridge()` consumption + `useEffect` keyed on `pendingScenario?.requestId` calling `loadScenario`
- `src/components/sandbox/SandboxContainer.test.tsx` - Added `useSandboxBridge` mock (mutable-closure-variable pattern matching existing `next/navigation`/trpc mocks) + 2 new tests

## Decisions Made
- Effect dependency array intentionally omits `sandboxState.loadScenario` (unstable reference every render) — only `pendingScenario?.requestId` drives the effect, matching the plan's explicit instruction and avoiding a render-loop risk from including an unmemoized function in a dependency array.
- No `eslint-disable` comment added for the narrowed dependency array — this codebase's `eslint.config.mjs` bypasses `eslint-config-next`/`typescript-eslint` in favor of `@next/eslint-plugin-next` standalone (see CLAUDE.md, Phase 10 decision), which does not register a `react-hooks/exhaustive-deps` rule, so no disable directive is needed or meaningful here.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Regenerated Prisma client and copied `.env` into the worktree**
- **Found during:** Task 1 (`npm run typecheck` acceptance criterion)
- **Issue:** The freshly-spawned git worktree had no `generated/prisma/` output and no `.env` (both correctly gitignored, but also not carried into a new worktree by default), so `tsc --noEmit` failed with `Cannot find module '../../../generated/prisma/client.js'` — a pre-existing environment-setup gap unrelated to this plan's own file changes, but blocking the required `npm run typecheck exits 0` verification for every task in this plan.
- **Fix:** Copied `.env` from the main repo checkout into the worktree (gitignored, not committed) and ran `npx prisma generate` (the same command `package.json`'s existing `postinstall` script already runs) to produce `generated/prisma/`.
- **Files modified:** none tracked by git (`.env` and `generated/prisma/` are both gitignored in the main repo already)
- **Verification:** `npm run typecheck` exits 0 after the fix
- **Committed in:** N/A (gitignored, not part of any task commit)

---

**Total deviations:** 1 auto-fixed (1 blocking — missing env var / missing generated client, both explicit RULE 3 examples)
**Impact on plan:** No scope creep — this only unblocked local verification tooling in a fresh worktree; zero source files were touched by the fix.

## Issues Encountered
None beyond the deviation above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Plan 17-02 (Gallery card wiring — `TryOnSandboxButton`, `GalleryCard`) can now call `useSandboxBridge().requestLoad(vesselA, vesselB)` from any client leaf composed under either `app/page.tsx`'s Home tree or `app/s/[shareId]/page.tsx`'s SharedScenarioPage tree.
- Full end-to-end human verification of all 4 Roadmap Phase 17 success criteria is deferred to Plan 17-04, as scoped.
- No blockers.

---
*Phase: 17-gallery-sandbox-bridge*
*Completed: 2026-07-25*
