---
created: 2026-07-25T00:00:00.000Z
title: Unsafe Result cast in useSandboxState's lazy initializer can crash the render
area: sandbox
resolves_phase: null
files:
  - src/components/sandbox/hooks/useSandboxState.ts
---

## Problem

Found by Phase 16's code review (16-REVIEW.md, CR-01) — pre-existing since commit
`3bfae34` (Phase 12-02), not introduced by Phase 16's `loadScenario()` refactor.

`useSandboxState.ts`'s `lastGoodClassification` lazy `useState` initializer casts
`classifyEncounter(seedA, seedB)` to `{ ok: true; value }` without checking `.ok`.
`Result<T>`'s failure variant has no `.value`, so if a degenerate/invalid seed pair
ever reaches this hook, `lastGoodClassification` becomes `undefined` and the very next
line (`useRef(lastGoodClassification.encounterType)`) throws a `TypeError` — an
unrecoverable render crash, since there's no `ErrorBoundary` anywhere in `src/app`.

The same "theoretically unreachable" case is defensively guarded elsewhere
(`src/server/application/scenario-service.ts`'s `getScenario`/`listGallery`), so the
invariant this file assumes ("seed vessels are always known-good") isn't actually
enforced at this file's boundary — only assumed by the comment at line 67-73.

## Solution

TBD. Likely shape: either (a) add a real `.ok` check with a safe fallback/error state
instead of the unchecked cast, or (b) add an `ErrorBoundary` around `SandboxContainer`
so a violated invariant degrades gracefully instead of crashing the whole page. Needs
a decision on which failure mode is preferred before implementing.
