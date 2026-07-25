---
phase: 17-gallery-sandbox-bridge
plan: 02
subsystem: ui
tags: [react, tailwind, gallery, sandbox, bridge, accessibility]

# Dependency graph
requires:
  - phase: 17-gallery-sandbox-bridge (plan 01)
    provides: "SandboxBridgeProvider.tsx (Context + Provider + useSandboxBridge() hook) — the page-scoped Gallery->Sandbox signaling channel"
provides:
  - "TryOnSandboxButton.tsx — the Gallery's sole interactive CTA, a \"use client\" leaf calling useSandboxBridge().requestLoad() + scrollIntoView"
  - "GalleryCard.tsx restructured with no <Link>, TryOnSandboxButton as its sole interactive child, group-focus-within hover-polish parity"
affects: [17-04-end-to-end-verification]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "group-focus-within: paired with every existing group-hover: utility on a card, so Tab-focusing a nested interactive child triggers the same whole-card polish as mouse hover"
    - "Overlay CTA over a preview chart: a centered absolute-positioned div with a semi-opaque scrim + button, both opacity-0 by default, opacity-100 on hover/focus-within, and a non-zero low-opacity default under an [@media(hover:none)] touch/coarse-pointer variant"

key-files:
  created:
    - src/components/gallery/card/TryOnSandboxButton.tsx
    - src/components/gallery/card/TryOnSandboxButton.test.tsx
  modified:
    - src/components/gallery/card/GalleryCard.tsx
    - src/components/gallery/card/GalleryCard.test.tsx
    - src/components/gallery/GalleryContainer.test.tsx

key-decisions:
  - "Used lucide-react's PlayCircle icon for the CTA (D-02's discretion pick) — conveys load/play/go, distinct from RotateCcw (Reset) and Link2 (Save)"
  - "Reworded an in-code comment to avoid the literal substring \"behavior:\" so the plan's own grep -c 'behavior:' acceptance check (verifying no hardcoded scroll behavior override) reads 0 rather than counting a comment mentioning the concept"

requirements-completed: [GAL-05, GAL-06]

# Metrics
duration: ~25min
completed: 2026-07-25
---

# Phase 17 Plan 02: Gallery Card Wiring Summary

**TryOnSandboxButton (a "use client" overlay CTA) replaces GalleryCard's whole-card `<Link>` to `/s/{id}`, calling `useSandboxBridge().requestLoad(vesselA, vesselB)` + a behavior-override-free `scrollIntoView` on click — the Gallery no longer navigates on card interaction.**

## Performance

- **Duration:** ~25 min
- **Completed:** 2026-07-25
- **Tasks:** 2
- **Files modified:** 5 (2 created, 3 modified)

## Accomplishments
- Built `TryOnSandboxButton` exactly per the plan's `<interfaces>` contract — a centered overlay over the mini-chart, revealed on `hover`/`focus-within` (not hover-only), with a distinct low-opacity default state on touch/coarse-pointer devices, styled `variant="default"` (never `variant="outline"`)
- Removed `GalleryCard`'s whole-card `<Link href="/s/{id}">` entirely, replacing it with a plain `group` div; `TryOnSandboxButton` is now the card's sole interactive/focusable element
- Extended the card's existing `group-hover:` whole-card hover polish to also fire on `group-focus-within:`, so keyboard Tab-focusing the new button triggers the same border/shadow lift mouse hover always did
- Updated `GalleryCard.test.tsx` and `GalleryContainer.test.tsx` to assert the new Link-free, button-based affordance (0 links, a `Try {title} on Sandbox` button per card, 6 buttons at the container level) instead of the removed `<Link>` behavior
- Full repo test suite (38 files / 212 tests), `npm run typecheck`, and `npm run lint` all pass clean (0 errors) after the change

## Task Commits

1. **Task 1: Create TryOnSandboxButton.tsx and its test** - `92349a6` (feat)
2. **Task 2: Remove GalleryCard's whole-card Link, compose TryOnSandboxButton, and fix the two existing test files it breaks** - `4605fea` (feat)

_Note: no `docs: complete plan` metadata commit in worktree mode — SUMMARY.md is committed separately per worktree protocol._

## Files Created/Modified
- `src/components/gallery/card/TryOnSandboxButton.tsx` - New `"use client"` leaf: `useSandboxBridge().requestLoad(vesselA, vesselB)` + behavior-override-free `scrollIntoView` on click; centered overlay (scrim + `Button`) revealed on `hover`/`focus-within`, low-opacity by default on touch
- `src/components/gallery/card/TryOnSandboxButton.test.tsx` - Proves accessible-name rendering, `requestLoad` call args, and the D-07 no-hardcoded-`behavior:"smooth"` constraint via a mocked `scrollIntoView`
- `src/components/gallery/card/GalleryCard.tsx` - Dropped `next/link` import + `<Link>` wrapper in favor of a plain `group` div; added `group-focus-within:` pairing to the existing hover-polish classes; composed `TryOnSandboxButton` inside a `relative` chart-preview wrapper
- `src/components/gallery/card/GalleryCard.test.tsx` - Replaced the removed Link-assertion test with a Link-free + button-reachability assertion; mocked `useSandboxBridge()` so the card's transitive `TryOnSandboxButton` render doesn't throw the outside-Provider guard
- `src/components/gallery/GalleryContainer.test.tsx` - Mocked `useSandboxBridge()`; replaced the "6 links" assertion with "0 links, 6 Try-on-Sandbox buttons"

## Decisions Made
- `PlayCircle` chosen for the CTA icon (D-02 discretion) — reads as "load and run," avoids visual collision with `RotateCcw`/Reset and `Link2`/Save already used elsewhere on the page
- Reordered `group-focus-within:`/`group-hover:` utility classes to satisfy this repo's `better-tailwindcss/enforce-consistent-class-order` lint rule (surfaced by `npm run lint` after Task 2's edit, fixed in the same commit — not a separate deviation, just conforming to existing tooling)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Regenerated Prisma client and copied `.env` into the worktree**
- **Found during:** Task 1 (`npm run typecheck` acceptance criterion)
- **Issue:** The freshly-spawned git worktree had no `generated/prisma/` output and no `.env` (both gitignored, not carried into a new worktree) — `tsc --noEmit` would fail on the missing generated Prisma client module, the same environment-setup gap already documented by Plan 17-01's SUMMARY.md
- **Fix:** Copied `.env` from the main repo checkout into the worktree (gitignored, not committed) and ran `npx prisma generate`
- **Files modified:** none tracked by git (both gitignored)
- **Verification:** `npm run typecheck` exits 0
- **Committed in:** N/A (gitignored, not part of any task commit)

**2. [Rule 1 - Bug] Reworded an in-code comment to stop it matching the plan's own `grep -c 'behavior:'` acceptance check**
- **Found during:** Task 1 acceptance-criteria verification
- **Issue:** The plan's acceptance criterion `grep -c 'behavior:' TryOnSandboxButton.tsx` outputs `0` is meant to catch a hardcoded `behavior: "smooth"` scroll override, but my first draft's explanatory comment used the literal substrings `scroll-behavior:` and `` `behavior: "smooth"` `` (quoting the thing NOT to do), which the grep counted as 2 matches despite the code itself having zero actual overrides
- **Fix:** Reworded the comment to describe the same constraint without using the literal colon-suffixed substring
- **Files modified:** `src/components/gallery/card/TryOnSandboxButton.tsx`
- **Verification:** `grep -c 'behavior:' TryOnSandboxButton.tsx` now outputs `0`; `npx vitest run TryOnSandboxButton.test.tsx` still passes (test asserts the actual call-arg object, unaffected by the comment wording)
- **Committed in:** `92349a6` (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking environment-setup gap, 1 self-inflicted acceptance-check wording fix)
**Impact on plan:** No scope creep — neither fix touched product behavior; both were needed purely to satisfy the plan's own stated verification commands.

## Issues Encountered
None beyond the deviations above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Plan 17-04 (end-to-end human verification) can now exercise the full Gallery -> Sandbox load-in-place flow: clicking any of the 6 "Try on Sandbox" buttons calls `requestLoad` and scrolls to `#sandbox`, with zero navigation and zero `<Link>` anywhere in the Gallery.
- Full repo test suite (38 files / 212 tests), typecheck, and lint all green after this plan.
- No blockers.

---
*Phase: 17-gallery-sandbox-bridge*
*Completed: 2026-07-25*
