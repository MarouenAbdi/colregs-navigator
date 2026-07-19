# Phase 7: Hero - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-18
**Phase:** 7-Hero
**Areas discussed:** Preview card motion, Preview card chart fidelity, Mobile stacking order, CTA scroll behavior

---

## Preview card motion

| Option | Description | Selected |
|--------|-------------|----------|
| Fully static (recommended) | No animation at all — matches the design mock exactly, avoids layout-shift risk above the future Gallery anchor, simplest to build/verify. | ✓ |
| Small tasteful animation | e.g. a subtly pulsing "● Live classification" dot, or a slowly animated bearing/heading line. Must not change card box height. | |

**User's choice:** Fully static (recommended)
**Notes:** None.

---

## Preview card chart fidelity

| Option | Description | Selected |
|--------|-------------|----------|
| Full detail (matches design exactly) | Range ring, dashed bearing line, compass-style tick marks, both vessel triangles with role badges — faithful hand-built static SVG. | ✓ |
| Simplified essentials | Just vessel icons, bearing line, and role badges — drop the range ring/tick marks. | |

**User's choice:** Full detail (matches design exactly)
**Notes:** None.

---

## Mobile stacking order (below 900px)

| Option | Description | Selected |
|--------|-------------|----------|
| Headline/copy/CTAs first (recommended) | Text and CTAs stay above the preview card — standard marketing-page convention. | ✓ |
| Preview card first | Leads with the visual proof before the headline — more attention-grabbing but delays CTAs below the fold on mobile. | |

**User's choice:** Headline/copy/CTAs first (recommended)
**Notes:** None.

---

## CTA scroll behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Smooth animated scroll (recommended) | CSS `scroll-behavior: smooth` — no JS needed; works with the existing `scroll-padding-top: 64px` header offset from Phase 6. | ✓ |
| Instant jump | Default browser anchor behavior — simplest, zero motion-related side effects, but feels abrupt. | |

**User's choice:** Smooth animated scroll (recommended)
**Notes:** None.

---

## Claude's Discretion

- Exact shadcn primitives composed for the CTAs and preview-card container (Button, Card, Badge).
- Exact fixture values (vessel A/B position, heading, speed) needed to reproduce the design mock's displayed Rule 15 crossing numbers via `classifyEncounter()`.
- Exact `lucide-react` icon(s), if any, used inside the preview card badges.

## Deferred Ideas

- None new. The "embed gallery on home page" todo was reviewed during todo cross-reference (matched Phase 7 by keyword overlap) but confirmed as Phase 9's scope, not folded here — see CONTEXT.md's "Reviewed Todos" section.
