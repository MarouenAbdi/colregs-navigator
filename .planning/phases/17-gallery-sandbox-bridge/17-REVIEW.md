---
phase: 17-gallery-sandbox-bridge
reviewed: 2026-07-25T14:44:06Z
depth: standard
files_reviewed: 14
files_reviewed_list:
  - app/page.tsx
  - app/s/[shareId]/page.tsx
  - src/components/gallery/GalleryContainer.test.tsx
  - src/components/gallery/card/GalleryCard.test.tsx
  - src/components/gallery/card/GalleryCard.tsx
  - src/components/gallery/card/TryOnSandboxButton.test.tsx
  - src/components/gallery/card/TryOnSandboxButton.tsx
  - src/components/sandbox/SandboxContainer.test.tsx
  - src/components/sandbox/SandboxContainer.tsx
  - src/components/sandbox/bridge/SandboxBridgeProvider.tsx
  - src/components/sandbox/hooks/useSandboxState.ts
  - src/domain/geometry/bearing/bearing.fixtures.ts
  - src/domain/geometry/bearing/bearing.test.ts
  - src/domain/geometry/bearing/bearing.ts
findings:
  critical: 0
  warning: 4
  info: 2
  total: 6
status: issues_found
---

# Phase 17: Code Review Report

**Reviewed:** 2026-07-25T14:44:06Z
**Depth:** standard
**Files Reviewed:** 14
**Status:** issues_found

## Summary

Reviewed the Gallery→Sandbox bridge (SandboxBridgeProvider, TryOnSandboxButton, GalleryCard wiring, useSandboxState's consumption of `pendingScenario`) plus the unrelated `bearing()` geometry module and its fixtures/tests bundled into this diff. `bearing.ts` is solid: the finite-input guard runs before any trig, the coincident-position threshold check is well-reasoned and covered by both exact and sub-threshold fixtures, and `npx tsc --noEmit` / the full relevant Vitest suite (38 tests) both pass clean. No critical/security-tier issues were found — no injection vectors, no hardcoded secrets, no dangerous APIs, no crash-on-null paths.

The bridge wiring itself works correctly for the tested paths (verified by re-running the suite), but has four real robustness/quality gaps worth fixing before this ships: a non-guaranteed-unique `Date.now()`-based `requestId` that can silently drop a rapid second "Try on Sandbox" click, a magic-string DOM id (`"sandbox"`) shared between two files with no compile-time link and a silently-swallowed failure mode if it drifts, an accessible-name/visible-text mismatch on the new CTA button that violates WCAG 2.5.3, and a silent (unlogged) early-return in `useSandboxState`'s single validation choke point. Two minor code-quality items round out the Info section.

## Warnings

### WR-01: `requestId` uses `Date.now()`, which is not guaranteed unique across rapid clicks

**File:** `src/components/sandbox/bridge/SandboxBridgeProvider.tsx:26-31`
**Issue:** `requestLoad` mints `requestId: Date.now()`, and `SandboxContainer`'s consuming effect is deliberately keyed only on `pendingScenario?.requestId` changing (`SandboxContainer.tsx:31-38`) so that "select the same Gallery scenario twice in a row" still re-triggers the load — this is explicitly called out as Roadmap Phase 17 success criterion 4 in the code's own comments. `Date.now()` has 1ms resolution. Two `requestLoad` calls that land in the same millisecond (double-click, a fast synthetic/programmatic trigger, or simply a slower/busier main thread) produce the same `requestId`, so the second call is silently swallowed — the effect's dependency doesn't change, `loadScenario` never re-fires, and the second selection is dropped with no error and no visual feedback. This directly undermines the exact guarantee the `requestId` field exists to provide.
**Fix:** Use a source guaranteed to differ per call, e.g. a monotonically-incrementing ref/counter instead of wall-clock time:
```ts
const requestCounter = useRef(0);
const requestLoad = useCallback((vesselA: Vessel, vesselB: Vessel) => {
  requestCounter.current += 1;
  setPendingScenario({ vesselA, vesselB, requestId: requestCounter.current });
}, []);
```

### WR-02: Hardcoded `"sandbox"` DOM id links two files with no compile-time safety, and fails silently

**File:** `src/components/gallery/card/TryOnSandboxButton.tsx:37`, `app/page.tsx:10`
**Issue:** `TryOnSandboxButton` scrolls via `document.getElementById("sandbox")?.scrollIntoView(...)`. The only place that id is defined is `<section id="sandbox">` in `app/page.tsx`. There is no shared constant, type, or test asserting these two string literals stay in sync — a rename of either string breaks the "scroll to Sandbox" behavior for every Gallery card, and the optional chaining means the failure is completely silent (no thrown error, no console warning), so it would likely only surface via a manual QA pass rather than a lint/type/test failure.
**Fix:** Extract a shared constant (e.g. `export const SANDBOX_SECTION_ID = "sandbox";` in a small shared module, or `sandbox/constants.ts`) imported by both `app/page.tsx` and `TryOnSandboxButton.tsx`, so a rename becomes a compile-time-visible change in both places.

### WR-03: `TryOnSandboxButton`'s accessible name doesn't contain its visible text (WCAG 2.5.3 Label in Name)

**File:** `src/components/gallery/card/TryOnSandboxButton.tsx:58-67`
**Issue:** The button's visible text content is `"Try on Sandbox"` (line 67, plus the decorative icon), but `aria-label={\`Try ${title} on Sandbox\`}` (line 58) fully overrides the accessible name to e.g. `"Try Classic crossing on Sandbox"`. WCAG 2.5.3 (Label in Name) requires that when a control has visible text, the accessible name contain that visible text as a contiguous substring so speech-input users ("click Try on Sandbox") and screen-magnifier + screen-reader users aren't given a name that doesn't match what they see. `"Try Classic crossing on Sandbox".includes("Try on Sandbox")` is `false` — the title is inserted in the middle of the phrase, not appended/prepended, so the visible string is not a substring of the accessible name.
**Fix:** Reorder so the visible text remains a contiguous substring, e.g. `aria-label={\`Try on Sandbox: ${title}\`}` or `aria-label={\`Try on Sandbox — ${title}\`}`, keeping "Try on Sandbox" intact and appending the disambiguating title.

### WR-04: `applyVesselUpdate`'s validation failure is a completely silent no-op

**File:** `src/components/sandbox/hooks/useSandboxState.ts:102-105`
**Issue:** `applyVesselUpdate` — documented as "the single choke point every drag handler AND every ControlPanel onChange handler funnels through" — returns early with no side effect at all when `VesselSchema.safeParse` fails on either vessel:
```ts
const parsedA = VesselSchema.safeParse(nextA);
const parsedB = VesselSchema.safeParse(nextB);
if (!parsedA.success || !parsedB.success) return;
```
No state changes, no error is logged, no `isDegenerate`/`saveError`-style flag is set, and no signal reaches the UI. In the current call sites this is low-risk because inputs are drawn from constrained fixtures/hull-drag math, but this is the app's one designated validation gate; a future caller (e.g. a malformed bridged Gallery scenario, or a future user-editable input) that hits this path fails completely invisibly, which will be very hard to diagnose from a bug report ("nothing happened when I clicked").
**Fix:** At minimum log the rejection in development (`if (!parsedA.success) console.error(parsedA.error)`), or better, surface it the same way the Pitfall-5 degenerate path already does (a dedicated `validationError` piece of state the UI can render), rather than a bare `return`.

## Info

### IN-01: `getVesselRole()` call in `GalleryCard.tsx` is structurally always `"give-way"`

**File:** `src/components/gallery/card/GalleryCard.tsx:36-40`
**Issue:** `cardVerdictBadge` computes `ROLE_BADGE_CLASSNAME[getVesselRole(giveWayLabel, classification)]` where `giveWayLabel` is literally `classification.giveWay` (already established non-null on the line above). Given `getVesselRole`'s implementation (`vessel-role.ts`), passing a vessel label that equals `classification.giveWay` can only ever return `"give-way"` — the `"mutual"` and `"stand-on"` branches are unreachable from this call site. The code currently produces the correct visual result, but the indirection misleadingly implies the badge color could vary per vessel/classification when it structurally cannot.
**Fix:** Either use `ROLE_BADGE_CLASSNAME["give-way"]` directly with a comment explaining why, or drop the intermediate variable and inline the equivalent constant to make the invariant explicit at the call site.

### IN-02: Hand-authored `useEffect` dependency array with no lint backstop

**File:** `src/components/sandbox/SandboxContainer.tsx:31-38`
**Issue:** `eslint.config.mjs` does not include `eslint-plugin-react-hooks`, so the intentionally-narrowed dependency array (`[pendingScenario?.requestId]`, deliberately omitting `pendingScenario` itself and `sandboxState.loadScenario`) is not backed by any tooling. The in-file comment explains *why* `requestId` alone is the key, which mitigates the risk, but nothing prevents a future edit (e.g. a well-meaning "fix the missing dep" pass) from silently changing this effect's behavior — either causing a stale reference to a differently-shaped pending scenario or an unintended re-run loop, depending on what's added.
**Fix:** Consider adding `eslint-plugin-react-hooks` to the flat config (even in warn-only mode) so exhaustive-deps violations elsewhere in the codebase surface automatically, and/or add an explicit disable comment on this specific line documenting the intentional narrowing so a future exhaustive-deps pass doesn't "fix" it blindly.

---

_Reviewed: 2026-07-25T14:44:06Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
