# Phase 6: Scaffolding - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-18
**Phase:** 6-Scaffolding
**Areas discussed:** Component install scope, Mobile nav collapse (640px), Source link & branding, Sticky-header scroll offset

---

## Component install scope

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal now | Install only Header/Footer's needed primitives; later phases run their own `shadcn add` | ✓ |
| Front-load everything | Install button/card/badge/tabs/select/slider/separator/sheet/label/input all in this phase | |

**User's choice:** Minimal now.
**Notes:** Keeps Scaffolding's PR scoped to what it actually delivers; avoids unused components sitting in the diff with no call sites until later phases.

---

## Mobile nav collapse (640px)

| Option | Description | Selected |
|--------|-------------|----------|
| Sheet drawer | Hamburger icon opens a shadcn Sheet with stacked nav links | |
| Stack inline below header | Nav links move to a stacked row within the same header bar | |
| Icon-only links | Keep all links visible but shrink to icons only | |
| (free text) | "Just keep the logo and Source buttons. Others should be hidden." | ✓ |

**User's choice:** Hide Sandbox/Gallery links entirely below 640px; keep only Logo + Source button. Confirmed explicitly on follow-up (no hamburger/drawer fallback).
**Notes:** Simplest mechanism — a responsive-hide utility on the two anchor links, no new interactive component needed. This also means `sheet` is not required for this phase's install list.

---

## Source link & branding

| Question | Answer |
|----------|--------|
| Is `github.com/MarouenAbdi/portfolio-project` (current git remote) the correct Source URL? | No — use `https://github.com/MarouenAbdi/colregs-navigator` instead |
| Existing logo/icon asset, or compose from lucide-react? | No existing asset found in repo; "Get it from the design" — match the icon shown in `Main-Design.png` as closely as possible using a lucide-react icon |

**Notes:** The git remote is a working-copy detail, distinct from the intended public-facing repo URL for the Source link.

---

## Sticky-header scroll offset

| Option | Description | Selected |
|--------|-------------|----------|
| Set it now in Scaffolding | `scroll-padding-top` sized to Header height, added while building the Header in this phase | ✓ |
| Defer to Hero/Gallery phases | Add scroll-padding-top later, whichever phase first wires a real anchor target | |

**User's choice:** Set it now in Scaffolding.
**Notes:** Scaffolding owns the Header height, so it's the single natural place to set this — Hero/Gallery inherit correct anchor-scroll behavior without needing to remember it themselves.

---

## Claude's Discretion

- Exact shadcn component names pulled for Header/Footer (beyond confirming `sheet` is excluded) — resolved during planning.
- Exact lucide-react icon chosen to match the design's logo glyph.

## Deferred Ideas

None — the pending "embed gallery on home page" todo is already tracked as Phase 9's concern (per STATE.md/PROJECT.md) and was not re-raised here.
