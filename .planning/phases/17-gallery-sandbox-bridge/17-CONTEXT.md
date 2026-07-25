# Phase 17: Gallery → Sandbox Bridge - Context

**Gathered:** 2026-07-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can click "Try on Sandbox" on any curated Gallery card and see the homepage Sandbox's live state update to that scenario's two vessels — no URL change, no page navigation — and the page auto-scrolls to the Sandbox afterward. This is the Gallery-side wiring against the `loadScenario()` entry point Phase 16 already generalized; it does not touch the Sandbox's own header/footer/overlay restructure (that's Phase 18) or the Guided Tour (Phase 19).

</domain>

<decisions>
## Implementation Decisions

### "Try on Sandbox" button visual treatment
- **D-01:** The button overlays the card's mini-chart preview (not a footer bar, not the badge row) — it fades in centered over the chart on hover/focus/touch, with the chart dimmed via a semi-opaque scrim for contrast (Canva-template-hover style).
- **D-02:** Label is icon + "Try on Sandbox" text (matches GAL-05's wording exactly), with a `lucide-react` icon for visual affordance — exact icon choice left to Claude's discretion.
- **D-03:** Solid accent-colored button (the app's teal accent, same family as Rule badges) — not the outline/ghost `Button` variant used by Sandbox's own Reset/Save — so it reads as the card's one clear call-to-action against the dimmed chart.
- **D-04:** The whole-card hover/focus polish (border lightens, subtle shadow) is preserved once the `<Link>` is removed, by wrapping `Card` in a plain `group` div instead. Must include `group-focus-within` (not just `group-hover`) so keyboard Tab triggers the same polish, not just mouse hover.

### Touch & keyboard discoverability
- **D-05:** On touch/coarse-pointer devices (`@media (hover: none)`), the overlay button and chart scrim sit at low opacity by default, brightening to full opacity on touch/`:active`/focus — guarantees discoverability without requiring a first "reveal" tap.
- **D-06 (locked by GAL-06, confirmed not reopened):** The button reveals on both `:hover` **and** `:focus-within` — not hover-only — so keyboard-only Tab navigation reaches it, matching today's whole-card `<Link>`'s unconditional Tab-reachability.

### Scroll-motion consistency
- **D-07:** The Gallery→Sandbox scroll reuses this app's existing global `scroll-behavior: smooth` convention (`app/globals.css`, gated behind `@media (prefers-reduced-motion: no-preference)`, already used by Hero's `#sandbox`/`#gallery` anchor links) — call `scrollIntoView()` with no explicit `behavior` override (or `behavior: 'auto'`), rather than hardcoding `behavior: 'smooth'` in JS. This keeps motion-accessibility behavior identical to every other same-page scroll in the app; the architecture research's own sample code (which hardcodes `behavior: 'smooth'`) should NOT be followed literally on this point.
- **D-08:** The scroll fires immediately on click, in parallel with the Context `requestLoad()` state update — not gated behind the Sandbox's re-render completing. The `#sandbox` anchor's position doesn't depend on which scenario is loaded, so there's no "scrolled but chart hasn't changed yet" flash to guard against; ROADMAP success criterion 2's "sequenced after the scenario state has actually updated" is satisfied by the state update landing via the same click, not by delaying the scroll's start.

### Post-load acknowledgment
- **D-09 (deferred, not implemented this phase):** No flash/highlight animation this phase — the scroll landing on a visibly different chart/verdict is the acknowledgment. Matches `.planning/research/FEATURES.md`'s MVP scope, which defers this explicitly to "Add After Validation." Out of scope for Phase 17, not silently dropped — see `<deferred>` below.

### Folded Todos
- **D-10 (folded todo):** Fix the unsafe `Result` cast in `useSandboxState.ts`'s lazy `lastGoodClassification` initializer — add a real `.ok` check with a safe fallback (falling back to a known-good default, e.g. the app's default fixture) instead of the unchecked cast. An `ErrorBoundary` was considered and explicitly rejected as the primary fix (doesn't address the root unenforced invariant), though nothing here prohibits adding one later as defense-in-depth. Source: `.planning/todos/pending/2026-07-25-unsafe-result-cast-in-usesandboxstate-lazy-initializer.md` (originally CR-01 from Phase 16's code review).
- **D-11 (folded todo):** Fix the drag-rarely-triggers-degenerate-state gap by widening `bearing()`'s coincident-position check from exact `dx === 0 && dy === 0` equality to a small distance threshold — not by snapping/rounding drag coordinates in `ChartPanel.tsx`. This fixes detection at its actual source (the domain geometry function) with no change needed to the drag/coordinate-conversion pipeline. Source: `.planning/todos/pending/2026-07-25-drag-to-coincident-position-rarely-triggers-unable-to-classify.md`. Exact threshold value is Claude's discretion (see below).

### Claude's Discretion
- Exact `lucide-react` icon for the "Try on Sandbox" button (D-02) — something conveying "load/play/go," consistent with existing icon choices elsewhere (`RotateCcw` for Reset, `Link2` for Save).
- Exact Tailwind opacity/transition values for the touch-visible low-opacity state (D-05) and the hover/focus-visible overlay treatment (D-01–D-03).
- Exact distance threshold for `bearing()`'s widened coincident check (D-11) — pick a small, reasonable value and document why in a code comment (this is a UX-tuning constant, not a business rule).
- Whether D-10's `.ok`-check fallback uses `crossingResidualBasicCase` (the app's existing default fixture) or another safe value — pick whichever most simply preserves the file's "seed vessels are always known-good" invariant.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Architecture & build order
- `.planning/research/ARCHITECTURE.md` — Pattern 1 (`loadScenario()` generalization, already shipped in Phase 16), Pattern 2 (`SandboxBridgeProvider` React Context — the locked state-bridge mechanism, NOT Zustand), Pattern 3 (ephemeral UI state stays local), Component Responsibilities table (`SandboxBridgeProvider`, `TryOnSandboxButton`, `GalleryCard`), Anti-Pattern 3 (don't make `GalleryContainer`/`GalleryCard` Client Components — push `"use client"` to the button leaf only), Anti-Pattern 4 (don't reach for Zustand), Suggested Build Order step [2]. **Exception:** ignore the sample code's hardcoded `scrollIntoView({behavior: 'smooth'})` — see D-07 above.
- `.planning/research/PITFALLS.md` — Pitfall 2 (Gallery↔Sandbox state-bridge seam, "Try on Sandbox" must not fall back to `router.push`), Pitfall 5 (green CI ≠ done; this phase's human-verification pass must explicitly check "no URL/navigation change" and "second card load replaces the first, not stale").
- `.planning/research/FEATURES.md` — Table Stakes section (touch/keyboard CTA reachability, scroll acknowledgment), Anti-Features section (why hover-only fails touch), MVP Definition (scroll-only acknowledgment, D-09's basis).

### Roadmap & requirements
- `.planning/ROADMAP.md` — Phase 17 section (Goal, Depends on Phase 16, Requirements: GAL-05/GAL-06, Success Criteria 1-4).
- `.planning/REQUIREMENTS.md` — GAL-05, GAL-06.
- `.planning/PROJECT.md` — v1.4 locked decision "Gallery fully switches to load-in-place (not both Link + button)" — the Out of Scope table entry ruling out a dual-mode card is directly relevant to removing `GalleryCard`'s whole-card `<Link>` entirely.

### Prior phase
- `.planning/phases/16-sandbox-mutation-path-generalization/16-CONTEXT.md` — confirms `loadScenario(vesselA, vesselB)` already exists on `useSandboxState()`'s return value; this phase is its first real consumer beyond Reset.

### Existing conventions this phase must reuse, not reinvent
- `app/globals.css` (~lines 163-177) — the `scroll-padding-top: 64px` + `prefers-reduced-motion`-gated `scroll-behavior: smooth` convention that D-07 requires reusing.

### Folded todos
- `.planning/todos/pending/2026-07-25-unsafe-result-cast-in-usesandboxstate-lazy-initializer.md` — D-10.
- `.planning/todos/pending/2026-07-25-drag-to-coincident-position-rarely-triggers-unable-to-classify.md` — D-11.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useSandboxState.ts`'s `loadScenario(vesselA, vesselB)` — already generalized in Phase 16; the bridge calls this directly, no new state-mutation logic needed.
- `GalleryCard.tsx`'s existing `cardVerdictBadge()`/rule-badge JSX and `vessel-role.ts` helpers — reused as-is; only the outer wrapping element (`<Link>` → plain `group` div) and the new overlay button change.
- `GalleryContainer.tsx`'s `rowToVessels(row)` conversion — already produces the exact `Vessel`-shaped payload the bridge needs; no new data-shape work required.
- `app/globals.css`'s `scroll-behavior`/`scroll-padding-top` convention — reused directly for D-07; no new motion-preference CSS needed.

### Established Patterns
- Server Component composing a Client Component leaf: `app/page.tsx` already stays a Server Component around `SandboxContainer`'s `"use client"` boundary today — Phase 17 adds a second, smaller Client leaf (`TryOnSandboxButton`) on the Gallery side, same established shape.
- The `group`/`group-hover:` Tailwind convention already used on today's whole-card `<Link className="group ...">` — D-04 preserves this via a plain wrapping `div`, not a new pattern.

### Integration Points
- `app/page.tsx` — wraps composed children (`Hero`, `SandboxContainer`, `GalleryContainer`) in the new `SandboxBridgeProvider`; Server/Client composition boundary otherwise unaffected (children stay Server Components, only the Provider itself is `"use client"`).
- `GalleryCard.tsx` — whole-card `<Link>` removed; `TryOnSandboxButton` added as the sole interactive child; `"use client"` pushed to that leaf only.
- `useSandboxState.ts` — no new public API needed beyond the already-shipped `loadScenario()`; D-10's `.ok`-check fix lands in this same file's lazy initializer.
- `src/domain/geometry/bearing/bearing.ts` — D-11's widened coincident-distance-threshold fix lands here.

</code_context>

<specifics>
## Specific Ideas

No updated visual mockup exists locally for this specific "Try on Sandbox" hover-CTA — `.planning/design/Main-Design.png` and `claude-design-prompt.json` both predate this milestone (dated 2026-07-17/18, before v1.4 started 2026-07-25) and show the Gallery card's *current* zero-visible-CTA state, not the updated design. The visual decisions above (D-01–D-04: overlay-on-chart placement, solid accent button, icon+text, preserved card-hover polish) were captured directly from user discussion in this session, not traced from a design file. Downstream planner/executor should implement against this discussion's decisions, not attempt to reverse-engineer them from the stale PNG.

</specifics>

<deferred>
## Deferred Ideas

- Post-load highlight/flash animation on the Sandbox (D-09) — explicitly out of scope this phase; candidate for a future v1.x polish pass once the scroll-only acknowledgment is validated.

### Reviewed Todos (not folded)
None — both todos matched by `gsd-sdk query todo.match-phase 17` were folded into scope (D-10, D-11).

</deferred>

---

*Phase: 17-Gallery → Sandbox Bridge*
*Context gathered: 2026-07-25*
