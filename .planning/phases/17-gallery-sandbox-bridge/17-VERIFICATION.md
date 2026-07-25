---
phase: 17-gallery-sandbox-bridge
verified: 2026-07-25T14:49:00Z
status: passed
score: 8/8 must-haves verified
overrides_applied: 0
---

# Phase 17: Gallery → Sandbox Bridge Verification Report

**Phase Goal:** Gallery → Sandbox bridge — clicking "Try on Sandbox" on any gallery card loads that scenario into the live Sandbox state with no URL change/navigation, auto-scrolls to the Sandbox section landing on already-updated content, is discoverable/operable via mouse hover, keyboard Tab focus, and touch/coarse-pointer, and a second card's load correctly replaces the first.
**Verified:** 2026-07-25T14:49:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth (ROADMAP success criteria + PLAN must_haves) | Status | Evidence |
|---|---|---|---|
| 1 | User can click "Try on Sandbox" on any gallery card and see the Sandbox chart/readouts immediately update to that scenario's two vessels, with no URL change and no full page navigation (Roadmap SC1) | ✓ VERIFIED | `TryOnSandboxButton.tsx` never imports `next/link`/`next/navigation`; `grep "next/link\|<Link"` in `src/components/gallery/` returns 0 matches. `handleClick` only calls `requestLoad(vesselA, vesselB)` + `scrollIntoView`. Wired end-to-end: `SandboxContainer.tsx:35-38` effect keyed on `pendingScenario?.requestId` calls `sandboxState.loadScenario(...)`. Confirmed live in a browser per Plan 17-04's human-verify checkpoint (typed "approved", 8-step walkthrough incl. URL-bar-unchanged check). |
| 2 | After clicking, the page smooth-scrolls to the Sandbox section automatically, landing on already-updated content (Roadmap SC2) | ✓ VERIFIED | `TryOnSandboxButton.tsx:37` fires `document.getElementById("sandbox")?.scrollIntoView({ block: "start" })` synchronously in the same handler as `requestLoad` (D-08), with no `behavior` key (`grep -c 'behavior:' TryOnSandboxButton.tsx` = 0), relying on `app/globals.css`'s `prefers-reduced-motion`-gated global `scroll-behavior: smooth` (confirmed present, lines 171-175). `#sandbox` section id present in `app/page.tsx`. Human-verified in Plan 17-04 step 4. |
| 3 | The "Try on Sandbox" CTA is discoverable/operable via mouse hover, keyboard Tab focus, and touch/coarse-pointer — not hover-only (Roadmap SC3 / GAL-06) | ✓ VERIFIED | `TryOnSandboxButton.tsx` reveal classes pair `group-hover:opacity-100` with `group-focus-within:opacity-100` on both the scrim and the Button (satisfies keyboard-Tab reachability, since `<Link>`'s old `focus-visible:ring` was removed and this is now the sole focusable element). Touch/coarse-pointer default via `[@media(hover:none)]:opacity-40` (non-zero, not hidden, D-05). `GalleryCard.tsx` extends whole-card hover polish to `group-focus-within:border-primary/40 group-focus-within:shadow-sm` (D-04). Human-verified across all 3 input modes in Plan 17-04 steps 2, 5, 6. |
| 4 | Loading a second gallery card after a first correctly replaces the previously loaded scenario, not stale (Roadmap SC4) | ✓ VERIFIED | `requestLoad` mints a new `requestId` per call (`Date.now()`), and `SandboxContainer`'s effect is keyed on `pendingScenario?.requestId` alone, re-firing on every distinct id. Two component tests in `SandboxContainer.test.tsx` (lines 358-393) prove this: first bridged load → "Overtaking" heading; second load with a different requestId → "Crossing" heading, with `queryByRole("heading", {name:"Overtaking"})` asserted absent. Human-verified end-to-end in Plan 17-04 step 7. See note below re: `Date.now()` millisecond-collision edge case (non-blocking). |
| 5 | SandboxBridgeProvider exposes `requestLoad`/`pendingScenario` via `useSandboxBridge()`, consumable by any client descendant on the page (Plan 17-01) | ✓ VERIFIED | `SandboxBridgeProvider.tsx` implements the exact `<interfaces>` contract; `useSandboxBridge()` throws when called outside the Provider (`grep -c "throw new Error"` = 1). |
| 6 | Both `app/page.tsx` and `app/s/[shareId]/page.tsx` wrap their `SandboxContainer` render in the Provider, so the outside-Provider guard never throws on either route (Plan 17-01) | ✓ VERIFIED | Both files read directly: `SandboxBridgeProvider` wraps `<Hero/>`/`#sandbox`/`#gallery` in `app/page.tsx`, and wraps `SandboxContainer`+`CopyLinkButton` in `app/s/[shareId]/page.tsx`. `npm run build` succeeds (no Server/Client boundary violation), confirming the composition is valid. |
| 7 | `useSandboxState()`'s lazy initializer never unwraps a `classifyEncounter()` Result via an unchecked cast; falls back to a known-good fixture, throws only if that also fails (D-10) | ✓ VERIFIED | `useSandboxState.ts:81-86` — real `if (initialResult.ok) return initialResult.value;` narrowing, falls back to `classifyEncounter(crossingResidualBasicCase...)`, throws only as last resort. `grep -c "as { ok: true"` = 0 (old unsafe cast fully removed). |
| 8 | `bearing()` classifies vessel pairs separated by less than 1e-6 chart-space units as coincident-position, not only exact (0,0) separation (D-11) | ✓ VERIFIED | `bearing.ts:25,42` — `COINCIDENT_DISTANCE_THRESHOLD = 1e-6`; `Math.hypot(dx, dy) < COINCIDENT_DISTANCE_THRESHOLD` replaces the old `dx===0 && dy===0` exact check (0 matches for the old pattern). `nearCoincidentPositionCase` fixture (1e-7 separation) + a passing test prove it. |

**Score:** 8/8 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `src/components/sandbox/bridge/SandboxBridgeProvider.tsx` | Context + Provider + `useSandboxBridge()` hook | ✓ VERIFIED | Matches `<interfaces>` contract exactly; all 5 Plan 17-01 Task-1 grep acceptance checks pass 1/1. |
| `app/page.tsx` | Home wrapped in `SandboxBridgeProvider` | ✓ VERIFIED | `grep -c "SandboxBridgeProvider"` = 3 (import + open + close tag). |
| `app/s/[shareId]/page.tsx` | SharedScenarioPage's `SandboxContainer` wrapped in `SandboxBridgeProvider` | ✓ VERIFIED | `grep -c "SandboxBridgeProvider"` = 3. |
| `src/components/sandbox/SandboxContainer.tsx` | bridge-consumption effect calling `loadScenario` on `pendingScenario.requestId` change | ✓ VERIFIED | Effect present exactly as specified (lines 35-38); wired to `useSandboxBridge()`. |
| `src/components/gallery/card/TryOnSandboxButton.tsx` | Sole interactive CTA calling `requestLoad` + `scrollIntoView` | ✓ VERIFIED | Matches `<interfaces>` prop contract; all D-01/D-02/D-03/D-05/D-06/D-07/D-08 acceptance checks confirmed via grep and code read. |
| `src/components/gallery/card/GalleryCard.tsx` | Link-free card composing `TryOnSandboxButton` as sole interactive child | ✓ VERIFIED | `next/link` import removed, `<Link` count 0, `TryOnSandboxButton` composed inside `relative` wrapper, `group-focus-within:border-primary/40` present. |
| `src/components/sandbox/hooks/useSandboxState.ts` | Safe `.ok`-checked lazy initializer, documented 2-level fallback | ✓ VERIFIED | See truth #7. |
| `src/domain/geometry/bearing/bearing.ts` | Distance-threshold coincident-position guard | ✓ VERIFIED | See truth #8. |

### Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| `TryOnSandboxButton.tsx` | `SandboxBridgeProvider` | `useSandboxBridge().requestLoad(vesselA, vesselB)` in `onClick` | ✓ WIRED | Confirmed by direct read + `TryOnSandboxButton.test.tsx`'s "calls requestLoad with exactly (vesselA, vesselB) on click" test. |
| `SandboxContainer.tsx` | `useSandboxState().loadScenario` | `useEffect` keyed on `pendingScenario?.requestId` | ✓ WIRED | Confirmed by direct read + `SandboxContainer.test.tsx`'s two bridge-consumption tests (single load, second-load-replaces-first). |
| `GalleryCard.tsx` | `TryOnSandboxButton.tsx` | JSX composition inside the relative chart-preview wrapper div | ✓ WIRED | `TryOnSandboxButton` rendered as sibling of `GalleryPreviewChart` inside `<div className="relative mb-4">`. |
| `useSandboxState.ts`'s lazy initializer | `crossingResidualBasicCase` fallback fixture | second `classifyEncounter()` call reached only if seed classification fails | ✓ WIRED | Confirmed by direct read (lines 81-86). |
| `bearing.ts` | `bearing.fixtures.ts`'s `nearCoincidentPositionCase` | `bearing.test.ts`'s new degenerate-case assertion | ✓ WIRED | Confirmed by direct read + passing test (`bearing.test.ts`, 9/9 tests). |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|---|---|---|---|
| Typecheck clean | `npm run typecheck` | exit 0, no errors | ✓ PASS |
| Production build succeeds (Server/Client boundary valid) | `npm run build` | Compiled successfully, `/` and `/s/[shareId]` both routed correctly | ✓ PASS |
| Full test suite green | `npm test` (vitest) | 38 files / 212 tests passed | ✓ PASS |
| Phase-specific tests green | `npx vitest run SandboxContainer.test.tsx TryOnSandboxButton.test.tsx GalleryCard.test.tsx GalleryContainer.test.tsx bearing.test.ts` | 6 files / 37 tests passed | ✓ PASS |
| Lint clean | `npm run lint` | 0 errors, 3 pre-existing unrelated `max-lines` warnings (classify-encounter files, not touched this phase) | ✓ PASS |
| No `<Link>`/anchor anywhere in Gallery | `grep -rn "next/link\|<Link" src/components/gallery/` | 0 real matches (only a code-comment string and a test-name string mentioning "Link") | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|---|---|---|---|---|
| GAL-05 | 17-01, 17-02, 17-03 | Click "Try on Sandbox" loads scenario into live Sandbox state, smooth-scrolled, no navigation, replaces whole-card Link | ✓ SATISFIED | Truths #1, #2, #4-#8 above; human-verified in 17-04. |
| GAL-06 | 17-02 | CTA reachable via mouse hover, keyboard focus, and touch — not hover-only | ✓ SATISFIED | Truth #3 above; `group-focus-within:` parity + touch-default opacity confirmed in code; human-verified in 17-04 steps 2/5/6. |

No orphaned requirements — REQUIREMENTS.md maps only GAL-05/GAL-06 to Phase 17, both are claimed by Plans 17-01/17-02 `requirements:` frontmatter.

**Documentation note (non-blocking):** `.planning/REQUIREMENTS.md` still shows GAL-05/GAL-06 checkboxes as `[ ]` and the traceability table status as "Pending" (lines 25-26, 63-64), even though ROADMAP.md marks Phase 17 `[x]` complete. This is a doc-sync lag, not a code gap — the actual implementation and tests fully satisfy both requirements. Recommend updating REQUIREMENTS.md checkboxes in a follow-up commit.

### Anti-Patterns Found

No TBD/FIXME/XXX/HACK/PLACEHOLDER markers or stub implementations found in any file modified by this phase (`SandboxBridgeProvider.tsx`, `app/page.tsx`, `app/s/[shareId]/page.tsx`, `SandboxContainer.tsx`, `TryOnSandboxButton.tsx`, `GalleryCard.tsx`, `useSandboxState.ts`, `bearing.ts`).

`.planning/phases/17-gallery-sandbox-bridge/17-REVIEW.md` (the phase's own code-review artifact, status `issues_found`, 0 critical / 4 warnings / 2 info) flagged four non-blocking quality gaps, none of which were subsequently fixed or filed as pending todos. Reproduced here for visibility since they were not resolved before phase close-out:

| File | Finding | Severity | Impact on this phase's goal |
|---|---|---|---|
| `SandboxBridgeProvider.tsx:26-31` | `requestId: Date.now()` has 1ms resolution; two `requestLoad` calls landing in the same millisecond would silently collide and drop the second load | ⚠️ Warning | Theoretically threatens Roadmap SC4 ("second load replaces first") under a sub-millisecond double-trigger, but not reachable by normal human mouse-click timing (confirmed working in Plan 17-04's human test and in the component tests). Non-blocking; recommend a monotonic counter instead of `Date.now()`. |
| `TryOnSandboxButton.tsx:37` / `app/page.tsx:10` | Hardcoded `"sandbox"` DOM id shared between two files with no compile-time link; silent failure (optional chaining) if either drifts | ⚠️ Warning | No current impact — both strings match today. Recommend extracting a shared constant. |
| `TryOnSandboxButton.tsx:58-67` | `aria-label` doesn't contain the visible button text as a contiguous substring (WCAG 2.5.3 Label in Name) | ⚠️ Warning | Does not block GAL-06's stated hover/focus/touch reachability criterion, but is a real accessibility gap for speech-input users. Recommend reordering the `aria-label`. |
| `useSandboxState.ts:102-105` | `applyVesselUpdate`'s Zod validation failure is a silent no-op (no log, no UI signal) | ⚠️ Warning | Not exercised by any Phase 17 call site (Gallery vessels are server-fetched/pre-validated); pre-existing pattern, not introduced by this phase. Non-blocking. |

None of these four items are TBD/FIXME/XXX debt markers in code (the debt-marker gate does not apply), and none contradict any must-have truth verified above. They are recorded here as accepted follow-up work, not phase-blocking gaps.

**Process note (non-blocking):** The two pending todos this phase was scoped to close (`2026-07-25-unsafe-result-cast-in-usesandboxstate-lazy-initializer.md`, `2026-07-25-drag-to-coincident-position-rarely-triggers-unable-to-classify.md`) are still present in `.planning/todos/pending/` rather than moved to `completed/`, even though both underlying fixes (D-10, D-11) are confirmed landed in code. Housekeeping only — recommend moving them.

### Human Verification Required

None outstanding. Plan 17-04 is a `checkpoint:human-verify` (`gate="blocking"`) task that already ran to completion: its SUMMARY.md documents the human typing "approved" after manually walking through all 8 verification steps (hover reveal, click-with-no-navigation, scroll-lands-on-updated-content, keyboard Tab + Enter, touch emulation, second-card-replaces-first, no console errors, `/s/[shareId]` regression) against the live `npm run dev` server. This satisfies all 4 Roadmap Phase 17 success criteria's explicit "human-verified" requirement — re-requesting the same manual walkthrough in this verification pass would be redundant with an already-completed blocking gate.

### Gaps Summary

No blocking gaps. All 8 must-have truths (4 Roadmap success criteria + 4 plan-level infrastructure/hardening truths) are VERIFIED against the actual codebase: code reads confirm every artifact and key link matches its plan contract exactly (including grep-level acceptance criteria reproduced independently), the full test suite (212/212) and phase-specific tests (37/37) pass, `npm run build`/`npm run typecheck`/`npm run lint` are all clean, and the phase's own human-verify checkpoint (17-04) was completed with an explicit "approved" before the phase closed.

Four non-blocking code-review findings (WR-01 through WR-04 in `17-REVIEW.md`) remain unresolved and are surfaced above for developer follow-up, along with two minor documentation/housekeeping lags (REQUIREMENTS.md checkboxes, todo-file archival). None of these affect goal achievement as stated.

---

_Verified: 2026-07-25T14:49:00Z_
_Verifier: Claude (gsd-verifier)_
