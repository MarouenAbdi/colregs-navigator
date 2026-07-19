---
created: 2026-07-18T01:57:55.164Z
title: Embed gallery on home page instead of separate route
area: ui
resolves_phase: 9
files:
  - app/gallery/page.tsx
  - app/page.tsx
---

## Problem

Phase 5 (plan 05-04) built `/gallery` as its own standalone route: a Server
Component that lists all curated scenarios via `gallery.list()` and links
each card to `/s/[shareId]`. During Phase 5's final human-verify checkpoint
(05-05 Task 3), the user tried the full save/share/gallery flow and said
they'd rather have the gallery embedded directly on the home page, below
the interactive sandbox, instead of living on a separate `/gallery` route.
This is a genuine product/UX design change, not a bug — the current
`/gallery` page works correctly as built and was explicitly left in place
for Phase 5's completion; the user deferred this change to a later session.

A reference design image was dropped in at `.planning/design/Main-Design.png`
(committed by the user directly, not part of any Phase 5 plan) — check it
for layout intent before starting this change.

## Solution

TBD. Likely shape: move `app/gallery/page.tsx`'s card-grid rendering logic
into a component composed directly into `app/page.tsx` below
`<SandboxContainer />`, fetching via the same `getCaller().gallery.list()`
server-side call. Decide whether `/gallery` as a route should be removed
entirely or kept as a redirect/alias to `/` for any existing bookmarks/links
(05-04's SUMMARY.md and 05-05-SUMMARY.md document the current shape and
contracts to preserve — `gallery.list()`, the card-to-`/s/[shareId]` link
pattern, the encounter-type badge + rationale text).
