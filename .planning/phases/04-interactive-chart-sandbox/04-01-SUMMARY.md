---
phase: 04-interactive-chart-sandbox
plan: 01
subsystem: ui
tags: [nextjs, tailwind-v4, vitest, jsdom, react-testing-library, typescript]

requires: []
provides:
  - "Next.js App Router root (app/layout.tsx, app/globals.css) with Tailwind v4 CSS-first pipeline"
  - "Vitest jsdom+RTL component-test harness (.tsx test support, @vitejs/plugin-react-swc, jest-dom matchers)"
  - "src/components/sandbox/types.ts — ChartPanelProps/ControlPanelProps/ReasoningPanelProps/VesselUpdateHandlers locked contracts"
  - "src/components/sandbox/vessel-role.ts — getVesselRole() shared give-way/stand-on/mutual derivation"
affects: [04-02, 04-03, 04-04, 04-05, 04-06]

tech-stack:
  added: [tailwindcss@4.3.3, "@tailwindcss/postcss@4.3.3", "@testing-library/react@16.3.2", "@testing-library/user-event@14.6.1", "@testing-library/jest-dom@6.9.1", jsdom@29.1.1, "@vitejs/plugin-react-swc@4.3.1"]
  patterns: ["Tailwind v4 CSS-first config (no tailwind.config.js)", "Per-file jsdom environment override via // @vitest-environment jsdom docblock, global environment stays node", "Shared sandbox prop-contract module locked before parallel component work begins"]

key-files:
  created: [app/layout.tsx, app/globals.css, postcss.config.mjs, next-env.d.ts, src/components/sandbox/types.ts, src/components/sandbox/vessel-role.ts, src/components/sandbox/vessel-role.test.ts, src/components/sandbox/environment.smoke.test.tsx]
  modified: [package.json, package-lock.json, tsconfig.json, vitest.config.ts, vitest.setup.ts]

key-decisions:
  - "vitest.config.ts keeps global environment: node (not jsdom) — only .tsx component tests opt into jsdom via a per-file docblock, so existing 15 domain/server .test.ts files are unaffected"
  - "types.ts and vessel-role.ts written to the exact contract specified in the plan's <interfaces> block verbatim — no deviation, since 04-02 through 04-06 build against this fixed interface in parallel"

patterns-established:
  - "Pitfall-4 smoke test (environment.smoke.test.tsx): a trivial RTL render+assert that must exist and pass before any real component test is written, guarding against the known jsdom+Vitest-4 GitHub issue #9279"
  - "Assertion<T> type-parameter augmentation: @vitest/expect declares Assertion<T = any> directly; jest-dom's own vitest.d.ts augments the re-exported vitest module instead, which doesn't merge under this vitest version — fix is to augment @vitest/expect directly with a matching T = any default"

requirements-completed: [CHRT-01]

duration: ~35min (across two sessions — see Issues Encountered)
completed: 2026-07-17
---

# Phase 04: Interactive Chart Sandbox — Plan 01 Summary

**Next.js App Router + Tailwind v4 + Vitest jsdom/RTL harness stood up, with the locked `src/components/sandbox/` prop-contract module every later plan in this phase imports.**

## Performance

- **Duration:** ~35 min (interrupted mid-Task-3 by a session/usage-limit termination; completed in a follow-up pass)
- **Tasks:** 3/3 completed
- **Files modified:** 12

## Accomplishments
- First UI-capable environment in the repo: `npx next build` and `npx vitest run` (full 15-file/119-test suite) both pass
- Tailwind v4 CSS-first pipeline wired (no `tailwind.config.js` needed at this phase's scope)
- jsdom+RTL harness confirmed working via the Pitfall-4 smoke test, with `.tsx` test support added to `vitest.config.ts` without disturbing the existing `.test.ts` domain/server suite
- `src/components/sandbox/types.ts` and `vessel-role.ts` created to the exact locked interface, ready for 04-02 through 04-06 to import unchanged

## Task Commits

Each task was committed atomically:

1. **Task 1: Package legitimacy audit + install Tailwind v4 and the RTL/jsdom test harness** - `aa0352c` (chore)
2. **Task 2: Next.js App Router scaffolding, Tailwind v4 config, tsconfig JSX support** - `2337375` (feat)
3. **Task 3: Vitest jsdom/tsx harness, shared sandbox prop contracts, and Pitfall-4 smoke test** - `8575745` (feat)

## Files Created/Modified
- `app/layout.tsx` - Root layout, imports `globals.css`, `slate-50` background per UI-SPEC
- `app/globals.css` - Tailwind v4 `@import "tailwindcss";` entrypoint
- `postcss.config.mjs` - Tailwind v4's `@tailwindcss/postcss` PostCSS plugin
- `next-env.d.ts` - Standard Next.js-generated triple-slash reference file
- `tsconfig.json` - Added `jsx: preserve`, `lib`, widened `include` to `app`/`vitest.setup.ts`
- `vitest.config.ts` - `.tsx` test support via `@vitejs/plugin-react-swc`, `include` widened to `.{ts,tsx}`
- `vitest.setup.ts` - `@testing-library/jest-dom/vitest` import + `Assertion<T>` type augmentation fix
- `src/components/sandbox/types.ts` - `ChartPanelProps`/`ControlPanelProps`/`ReasoningPanelProps`/`VesselUpdateHandlers`
- `src/components/sandbox/vessel-role.ts` - `getVesselRole()`
- `src/components/sandbox/vessel-role.test.ts` - 3 test cases (give-way/stand-on/mutual)
- `src/components/sandbox/environment.smoke.test.tsx` - Pitfall-4 early-warning smoke test

## Decisions Made
None beyond what's in `key-decisions` above — followed the plan's exact target shapes for `types.ts`/`vessel-role.ts`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `Assertion<T>` type-parameter mismatch broke `tsc --noEmit`**
- **Found during:** Post-Task-3 verification (`npx tsc --noEmit`)
- **Issue:** The custom `declare module "@vitest/expect" { interface Assertion<T = unknown> ... }` augmentation used `T = unknown` as the default type parameter, but `@vitest/expect`'s own `Assertion<T = any>` interface declares `T = any` — TypeScript requires all merged declarations of an interface to have identical type parameter defaults (TS2428: "All declarations of 'Assertion' must have identical type parameters"), so `tsc --noEmit` failed.
- **Fix:** Changed the augmentation's default from `T = unknown` to `T = any` to match `@vitest/expect`'s own declaration exactly, confirmed by reading `node_modules/@vitest/expect/dist/index.d.ts` directly.
- **Files modified:** `vitest.setup.ts`
- **Verification:** `npx tsc --noEmit` exits 0; `npx vitest run` (full suite) still 15 files/119 tests passing after the fix
- **Committed in:** `8575745` (Task 3 commit — fix applied before the task commit was made, not as a separate commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary correctness fix for the type augmentation Task 3 itself introduced; no scope creep, no change to the locked `types.ts`/`vessel-role.ts` contract.

## Issues Encountered
The original executor agent for this plan was terminated mid-Task-3 by an API session/usage-limit error (not a plan or code defect) after Tasks 1 and 2 were already committed and Task 3's files were fully written and staged (uncommitted). The orchestrator inspected the worktree, verified Task 3's staged content matched the plan's `<interfaces>` block verbatim, ran the full verification suite (`npx vitest run` on the two new test files, the full suite, `npx next build`, and `npx tsc --noEmit`), found and fixed the `Assertion<T>` type mismatch above, then committed Task 3 and completed this SUMMARY.md to close out the plan safely without duplicating or discarding the partial work.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
`src/components/sandbox/types.ts` and `vessel-role.ts` are ready for 04-03 (ChartPanel), 04-04 (ControlPanel), and 04-05 (ReasoningPanel) to import unchanged in Wave 2. No blockers.

## Self-Check: PASSED

- All 8 `key-files.created` verified present on disk with `[ -f ]`
- `git log --oneline --all --grep="04-01"` returns 3 commits (Task 1, Task 2, Task 3)
- All task-level `<acceptance_criteria>` re-verified: `npm ls` for all 7 packages exits 0; `npx next build` exits 0; `npx vitest run` on both new test files exits 0
- Plan-level `<verification>` re-run: `npx next build` ✓, `npx vitest run` (full suite, 15 files/119 tests) ✓, `npx vitest run src/components/sandbox/environment.smoke.test.tsx` ✓, `npx tsc --noEmit` ✓ (clean after the Assertion<T> fix)

---
*Phase: 04-interactive-chart-sandbox*
*Completed: 2026-07-17*
