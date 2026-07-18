# Phase 7: Hero - Context

**Gathered:** 2026-07-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 7 (Hero) delivers the one genuinely new UI surface in the v1.1 redesign: a net-new marketing Hero section (Direction A only) rendered above the existing `SandboxContainer` on the home page. It ships the headline/copy/CTAs, an illustrative (static, non-interactive) live-classification preview card, and the anchor-scroll wiring for `#sandbox`/`#gallery`. It builds nothing that the Sandbox or Gallery phases themselves own — the preview card is a decorative stand-in, never wired to the real sandbox's live state. Requirements: HERO-01 through HERO-04 (see REQUIREMENTS.md).

</domain>

<decisions>
## Implementation Decisions

### Preview card motion
- **D-01:** The illustrative preview card is fully static — no animation (no pulsing "live" dot, no animated bearing line). Matches the design mock exactly and avoids the layout-shift risk flagged in `research/PITFALLS.md` (a Hero box-height change after initial paint can throw off the native browser fragment-scroll math for the future `/#gallery` anchor).

### Preview card chart fidelity
- **D-02:** The mini polar-chart illustration matches the design mock's full detail: range ring, dashed bearing line, compass-style tick marks, both vessel triangles with role badges — a faithful hand-built static SVG, not a simplified/reduced version. Consistent with the project's already-locked "design followed exactly" decision.
- **D-03 (carried from research/PITFALLS.md):** This illustration must NOT share code/component with the real interactive `ChartPanel.tsx` — build it as an independent, static SVG. Reusing `ChartPanel`'s rendering code for a decorative preview is an explicit warning sign in Pitfall 1 (risk of coupling the decorative preview to the live hit-testing contract during future Sandbox restyle work).

### Mobile layout (below 900px)
- **D-04:** Below the 900px breakpoint, Hero collapses to a single column with headline/copy/CTAs stacked above the preview card (text-first). Standard marketing-page convention — gets visitors to the primary CTA fastest on small screens, consistent with HERO-04's single-column requirement.

### CTA scroll behavior
- **D-05:** Both Hero CTAs ("Open the sandbox" → `#sandbox`, "Classic encounters" → `#gallery`) use smooth-animated scroll (`scroll-behavior: smooth` in CSS, no JS scroll library needed). Works with the existing `scroll-padding-top: 64px` header offset already set in Phase 6's `app/globals.css`.
- **D-06 (carried forward, not re-decided):** `#gallery` does not exist as a real anchor target until Phase 9 ships — Phase 6's Header nav already links `href="#gallery"` and ships to `main` in that same dangling state as an accepted interim condition. Hero's "Classic encounters" CTA follows the identical precedent: point at `#gallery` now, accept it's a no-op until Phase 9's PR lands (no error, browser simply doesn't scroll). Do not build a temporary `/gallery`-route fallback for this — would contradict the already-shipped Header precedent and add throwaway code.

### Preview card fixture data
- **D-07 (carried from research/ARCHITECTURE.md):** The preview card's canned numbers (Rule 15, Crossing, "Vessel A gives way", RANGE/BEARING/CPA readouts) are produced by calling `classifyEncounter()` from `src/domain/colregs/` directly against a new fixed fixture — no tRPC, no server round-trip. Mirrors `SandboxContainer`'s existing default-classification fixture pattern (`src/domain/colregs/classify-encounter.fixtures.ts`). The specific vessel position/heading/speed values that reproduce the design mock's exact displayed numbers (2.99 NM range, 061° bearing, 1.18 NM CPA, Rule 15 crossing, Vessel A gives way) are a research/planning task, not a user decision.

### Claude's Discretion
- Exact shadcn primitives composed for the CTAs and preview-card `Card` container (Button, Card, Badge — per `research/STACK.md`'s "Hero preview / reasoning-trail containers → Card" guidance).
- Exact fixture values (vessel A/B position, heading, speed) needed to reproduce the design mock's displayed Rule 15 crossing numbers via `classifyEncounter()`.
- Exact `lucide-react` icon(s), if any, used inside the preview card badges — match the design image as closely as the available icon set allows (same approach as Phase 6's D-05 logo-icon precedent).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design source of truth
- `.planning/design/Main-Design.png` — full home-page mock; the Hero section (top of the image: eyebrow badge, headline with teal-highlighted clause, supporting copy, two CTAs, "Grounded in Rules 11-18..." trust note, and the right-hand "Live classification" preview card) is the exact visual target for this phase
- `.planning/design/claude-design-prompt.json` — original design brief (brand personality, color system, typography, motion philosophy)

### Architecture
- `.planning/research/ARCHITECTURE.md` §"New Flow: Hero's illustrative preview card" (line ~173) — `Hero.tsx` composition, no-tRPC/direct-`classifyEncounter()`-call pattern, fixture reuse guidance
- `.planning/research/ARCHITECTURE.md` §folder structure (line ~76) — `src/components/hero/Hero.tsx` (markup only) is the target location, sibling to `sandbox/`, `gallery/`, `layout/`, `ui/`
- `.planning/research/ARCHITECTURE.md` §dependency rules (line ~248) — `hero/` may import `ui/*` and `shared/*` one-directionally; may call `src/domain/*` pure functions directly; must NOT introduce a new `src/server/*`/tRPC round-trip

### Pitfalls (Hero-tagged)
- `.planning/research/PITFALLS.md` Pitfall 1, warning signs — do not share SVG chart code between the Hero preview and the real interactive `ChartPanel.tsx`
- `.planning/research/PITFALLS.md` Pitfall 6 — route-to-anchor/fragment-scroll mechanics; relevant to both CTAs since `#gallery` doesn't resolve to real content until Phase 9
- `.planning/research/FEATURES.md` line ~91 — post-paint layout-shift risk above the Gallery anchor if the Hero's box height changes after initial paint (informs D-01's "fully static" decision)

### Requirements & roadmap
- `.planning/REQUIREMENTS.md` — HERO-01 through HERO-04, full acceptance criteria
- `.planning/ROADMAP.md` — Phase 7 success criteria, Phase 6→7 dependency (consumes Scaffolding's tokens/primitives/shell)
- `.planning/PROJECT.md` — locked v1.1 decisions (Hero Direction A only; dark-mode only; design followed exactly)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/ui/button.tsx` (shadcn Button, already installed in Phase 6) — both Hero CTAs compose this
- `src/domain/colregs/classify-encounter.fixtures.ts` — existing fixture pattern to mirror for the Hero preview card's fixed illustrative encounter
- `src/components/layout/Header.tsx` — already links `href="#sandbox"` / `href="#gallery"`; confirms the anchor-id contract Hero must satisfy (`id="sandbox"` needs to land on the Sandbox section wrapper) and the accepted "`#gallery` is a no-op until Phase 9" precedent (D-06)
- `app/globals.css` line 141 — `scroll-padding-top: 64px` already accounts for the sticky header's height; Hero's anchor targets inherit this for free

### Established Patterns
- Semantic domain color tokens (give-way / stand-on / mutual) already registered under Tailwind v4 `@theme` in Phase 6 — reuse these for the preview card's role badges, do not invent new color values
- No `tailwind.config.js` — all theming lives in `app/globals.css` via `@theme`/`@theme inline`
- Feature-first component folders (`sandbox/`, `layout/`) each keep markup, styling, and logic as separate concerns — `hero/` should follow the same shape (`Hero.tsx` markup-only, per ARCHITECTURE.md)

### Integration Points
- `app/page.tsx` currently renders only `<SandboxContainer />` — this phase adds `<Hero />` above it and adds `id="sandbox"` to the container/section `SandboxContainer` renders into (exact host element TBD at planning)
- `app/globals.css` — this phase adds `scroll-behavior: smooth` (D-05) alongside the existing `scroll-padding-top: 64px`

</code_context>

<specifics>
## Specific Ideas

- Headline copy is fully specified visually in `Main-Design.png`: "Two vessels. One rulebook. **See who gives way — and why.**" (teal-highlighted final clause), eyebrow badge "● Collision-avoidance rules engine" above it, supporting paragraph below, then "Open the sandbox →" (filled) and "Classic encounters" (outlined) buttons, then a small checkmark-icon trust note: "Grounded in Rules 11-18 of the actual COLREGS — Steering & Sailing Rules, conduct in sight of one another."
- Preview card content is fully specified visually: header row "● Live classification" + "BRG-ring · 12 NM"; mini polar chart with range ring, dashed bearing line, two vessel triangles (A red/give-way, B teal/stand-on) with badges; rule banner "Rule 15 — Crossing — Vessel A gives way"; three readout tiles (RANGE 2.99 NM, BEARING 061°, CPA 1.18 NM).

</specifics>

<deferred>
## Deferred Ideas

None new — discussion stayed within Phase 7's scope.

### Reviewed Todos (not folded)
- "Embed gallery on home page instead of separate route" (`.planning/todos/pending/2026-07-18-embed-gallery-on-home-page-instead-of-separate-route.md`) — matched Phase 7 by keyword overlap ("gallery", "home", "page") during todo cross-reference, but this is explicitly Phase 9's (Gallery) concern per ROADMAP.md/REQUIREMENTS.md (GAL-01 through GAL-04) and PROJECT.md's progress notes. Not folded into Phase 7 — Hero's CTA only needs to point at `#gallery` (D-06), not build the section itself.

</deferred>

---

*Phase: 7-Hero*
*Context gathered: 2026-07-18*
