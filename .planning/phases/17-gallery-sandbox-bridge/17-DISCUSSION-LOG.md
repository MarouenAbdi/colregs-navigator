# Phase 17: Gallery → Sandbox Bridge - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-25
**Phase:** 17-Gallery → Sandbox Bridge
**Areas discussed:** "Try on Sandbox" visual treatment, Touch & keyboard discoverability, Scroll-motion consistency, Post-load acknowledgment, Folded Todos (backlog cleanup)

---

## "Try on Sandbox" visual treatment

| Option | Description | Selected |
|--------|-------------|----------|
| Overlay on the mini-chart | Button fades in centered over the chart preview on hover/focus, chart dimmed for contrast | ✓ |
| Full-width footer bar | Dedicated button spans the card bottom, reserved layout slot | |
| In the badge row | Small button/icon next to existing Rule-N and verdict badges | |

**User's choice:** Overlay on the mini-chart

| Option | Description | Selected |
|--------|-------------|----------|
| Icon + "Try on Sandbox" | Matches GAL-05 wording exactly, icon adds affordance | ✓ |
| Text only, no icon | Simplest, matches card's current text-forward style | |
| Icon only + tooltip/aria-label | Minimal footprint, higher risk of being non-obvious | |

**User's choice:** Icon + "Try on Sandbox"

| Option | Description | Selected |
|--------|-------------|----------|
| Solid accent button | Filled teal accent, high contrast against dimmed chart | ✓ |
| Outline/ghost button | Matches existing outline Button variant (Reset/Save), more subdued | |

**User's choice:** Solid accent button

| Option | Description | Selected |
|--------|-------------|----------|
| Keep card-level hover polish | Wrap Card in plain `group` div, preserve border/shadow highlight; add `group-focus-within` | ✓ |
| Feedback only on the overlay itself | Remove whole-card hover chrome, scope hover semantics to the one interactive element | |

**User's choice:** Keep card-level hover polish

**Notes:** No updated visual mockup exists locally for this hover-CTA — only a stale pre-v1.4 design PNG showing the current zero-visible-CTA card. Decisions captured directly from user discussion.

---

## Touch & keyboard discoverability

| Option | Description | Selected |
|--------|-------------|----------|
| Always faintly visible, brightens on touch/focus | Low opacity by default on coarse-pointer via `@media (hover: none)`, full opacity on `:active`/focus | ✓ |
| Reveal only on first tap (matches hover semantics) | Mirrors hover exactly, costs first-time touch users an extra tap | |

**User's choice:** Always faintly visible, brightens on touch/focus

**Notes:** Keyboard-focus reveal (`:hover` AND `:focus-within`) was presented as already locked by GAL-06 rather than asked as an open question (only one genuine option existed) — confirmed, not reopened.

---

## Scroll-motion consistency

| Option | Description | Selected |
|--------|-------------|----------|
| Respect the existing convention | `scrollIntoView()` with no explicit `behavior` override, letting globals.css's `prefers-reduced-motion`-gated `scroll-behavior: smooth` decide | ✓ |
| Force smooth scroll unconditionally in JS | Explicit `behavior: 'smooth'` regardless of reduced-motion preference, matches architecture research's sample code as-is | |

**User's choice:** Respect the existing convention

| Option | Description | Selected |
|--------|-------------|----------|
| Fire scroll immediately on click | No gating on Sandbox re-render; anchor position doesn't depend on scenario data | ✓ |
| Delay scroll until after Sandbox re-render commits | Explicitly wait for the pendingScenario effect to apply first | |

**User's choice:** Fire scroll immediately on click

---

## Post-load acknowledgment

| Option | Description | Selected |
|--------|-------------|----------|
| Scroll-only (matches research MVP) | No flash/highlight this phase; scroll landing on a different chart is the acknowledgment | ✓ |
| Include a brief highlight/flash | One-time visual pulse when a bridge-driven load lands | |

**User's choice:** Scroll-only

---

## Folded Todos (backlog cleanup)

Two pending todos scored as possible matches for Phase 17 (`gsd-sdk query todo.match-phase 17`), both pre-existing tech debt logged during Phase 16's closeout and not directly related to the Gallery→Sandbox bridge itself. User chose to fold both in anyway.

| Option | Description | Selected |
|--------|-------------|----------|
| Drag rarely triggers degenerate state (float-precision gap) | Pre-existing floating-point precision gap in the coincident-position check | ✓ (folded) |
| Unsafe Result cast in useSandboxState's lazy initializer | Pre-existing unsafe cast in the lazy classification initializer | ✓ (folded) |

**User's choice:** Fold both.

For the unsafe-cast todo:

| Option | Description | Selected |
|--------|-------------|----------|
| Add a real `.ok` check + fallback | Fix at the source; fall back to a known-safe default instead of the unchecked cast | ✓ |
| Add an ErrorBoundary around SandboxContainer | Defense-in-depth; limits blast radius, doesn't fix the root assumption | |
| Both | Fix the cast AND add an ErrorBoundary | |

**User's choice:** Add a real `.ok` check + fallback

For the coincident-detection todo:

| Option | Description | Selected |
|--------|-------------|----------|
| Widen bearing()'s coincident check to a distance threshold | Fixes detection at its domain-geometry source | ✓ |
| Snap/round chart coordinates during drag | Touches ChartPanel's drag-coordinate pipeline instead | |

**User's choice:** Widen bearing()'s coincident check to a distance threshold

---

## Claude's Discretion

- Exact `lucide-react` icon for the "Try on Sandbox" button.
- Exact Tailwind opacity/transition values for the touch-visible low-opacity state and the hover/focus-visible overlay treatment.
- Exact distance threshold for `bearing()`'s widened coincident check (document the choice in a code comment).
- Whether the `.ok`-check fallback uses `crossingResidualBasicCase` or another safe default value.

## Deferred Ideas

- Post-load highlight/flash animation on the Sandbox — explicitly out of scope this phase, candidate for a future v1.x polish pass.
