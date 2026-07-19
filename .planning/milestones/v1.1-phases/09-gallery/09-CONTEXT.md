# Phase 9: Gallery - Context

**Gathered:** 2026-07-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 9 (Gallery) embeds the curated gallery of preset COLREGS encounters as a card-grid section on the home page, below the Sandbox, and removes the standalone `/gallery` route in favor of a permanent redirect to `/#gallery`. It closes the v1.0 pending todo about gallery placement. It touches `src/server/db/curated-scenarios.ts` (the DB seed data itself) because the design's 6 gallery cards require content this data doesn't currently have — this is the one part of the v1.1 milestone that legitimately reaches into the server/db layer, unlike Hero/Sandbox which were locked to presentation-only changes. Requirements: GAL-01 through GAL-04 (see REQUIREMENTS.md).

</domain>

<decisions>
## Implementation Decisions

### Gallery card data & labels
- **D-01:** The Gallery's 6 cards match the design's exact labels/rules — Classic crossing (Rule 15, A gives way), Head-on meeting (Rule 14, mutual), Overtaking (Rule 13, A gives way), Sailing has priority (Rule 18, A gives way), Not under command (Rule 18, A gives way), In doubt (Rule 7, mutual) — the same 6 labels Phase 8 already built for the Sandbox's chip row. `curated-scenarios.ts` (the DB seed data `gallery.list()` reads) is updated to match: its current 6 entries don't (no `not-under-command`/`in-doubt` case, a stand-on-mirror duplicate, no title field — see `08-CONTEXT.md` D-03 for the original discovery of this mismatch).
- **D-02:** The two new fixtures needed (`not-under-command`, `in-doubt`) reuse Phase 8's already-verified vessel geometry from `src/components/sandbox/chip-scenarios.ts` (`notUnderCommandVessels`, `inDoubtVessels`) rather than deriving new literals from scratch — that geometry is already tested against `classifyEncounter()` and visually proven in the Sandbox chips. Since `curated-scenarios.ts` (server layer) must not depend on `src/components/sandbox/` (UI layer) for a directional-dependency reason, planning should resolve exactly where the shared literal values live (e.g. new named exports in `src/domain/colregs/classify-encounter.fixtures.ts`, consumed by both `chip-scenarios.ts` and `curated-scenarios.ts`) — this is an implementation detail, not a further user decision.
- **D-03:** The current entry #2 ("stand-on crossing" — same geometry as entry #1, roles mirrored) is dropped. The design shows exactly 6 cards with no mirror-pair entry; keeping it would make Gallery a 7-card grid the design doesn't show.
- **D-04:** Card title + one-line description text is used **verbatim from the design image** (`Main-Design.png`), not freshly drafted. Exact text, transcribed directly from the design (see `<specifics>` below) — `CuratedScenario` needs a new `title` field (currently only `rationale` exists, which is a longer explanatory sentence, not this punchier one-liner).
- **D-05:** `prisma/seed.ts` is updated for the new 6-entry curated set and the local dev DB is reseeded as part of this phase's work — no production/user data exists to lose (portfolio project, no auth). Same mechanism Phase 5 already used to seed the original 6 scenarios.

### Card mini-chart preview
- **D-06:** Each of the 6 gallery cards gets a real static SVG mini-chart illustration (two vessel triangles, role badges, connecting line) — matching what `Main-Design.png` actually shows on every card — not a simplified text/badge-only treatment. Satisfies GAL-01's "matching the design's card grid exactly."
- **D-07:** The mini-chart is built at **reduced visual detail** relative to the Hero preview card — vessel triangles + role badges + connecting line only, no range rings/grid pattern/dashed heading vectors. This matches what's actually visible in the design at the gallery card's smaller size (Hero's full richness — grid, rings, radial gradient sector — is not present on the gallery cards in the design image).
- **D-08 (carried from Hero's D-03 precedent):** This is a genuinely new, parametrized component (accepts a `vesselA`/`vesselB` pair per card, renders 6 times) — it does NOT reuse `HeroPreviewCard.tsx` directly (that component is hardcoded to one fixture) and does NOT share code with the live interactive `ChartPanel.tsx`, consistent with the established "decorative static illustration stays independent of the live chart" precedent from Hero.
- **D-09 (flagged for planning, not a user decision):** This is the second consumer of the "static mini polar-chart driven by a `Vessel` pair" pattern (Hero's `hero-preview-geometry.ts` was the first). Per this project's established convention ("Shared/decorative primitives: extract only on a real second consumer" — CLAUDE.md), planning should evaluate extracting the shared geometry helpers (`chartToScreen`, heading-vector endpoint, hull path constants) that both Hero's and Gallery's static illustrations need into `src/components/shared/`, rather than duplicating them a second time. Not a user preference — follows an already-locked codebase convention.

### Claude's Discretion
- Exact location for the two new shared vessel-geometry fixture literals (D-02) — domain fixtures file vs. another shared location; resolve during planning respecting the server/UI dependency direction.
- Whether to extract shared static-chart geometry helpers into `src/components/shared/` now (D-09) or keep Gallery's version independent for this phase — evaluate during planning against the actual code shape once both components exist side by side.
- Exact `CuratedScenario` type/shape change needed to add the `title` field (D-04).
- Gallery grid's intermediate breakpoint between the 3-column desktop layout and the 1-column mobile layout (GAL-01's "3 → 2 → 1 columns") — no tablet-width mock exists; derive a sensible middle breakpoint consistent with the project's existing 900px/640px convention.

### Folded Todos
- "Embed gallery on home page instead of separate route" (`.planning/todos/pending/2026-07-18-embed-gallery-on-home-page-instead-of-separate-route.md`) — this is exactly what Phase 9 delivers (GAL-01 through GAL-04). Folded in full; the todo's own "Solution" sketch (move `app/gallery/page.tsx`'s card-grid logic into a component composed into `app/page.tsx` below `SandboxContainer`, decide on redirect vs. removal) matches this phase's locked ROADMAP scope exactly.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design source of truth
- `.planning/design/Main-Design.png` — the Gallery section (bottom of the home-page mock, below the Sandbox): eyebrow "Curated scenarios", heading "Classic encounters, one click away", subhead "Textbook COLREGS geometries. Load any into the sandbox and drag from there.", 6-card grid (3 cols × 2 rows) — each card: mini static chart, Rule badge + role badge row, bold title, one-line description
- `.planning/design/claude-design-prompt.json` — original design brief (color system, typography, motion philosophy)

### Prior-phase precedent (directly informs this phase's approach)
- `.planning/phases/08-sandbox/08-CONTEXT.md` D-03 — the original discovery that `curated-scenarios.ts`'s 6 entries don't match the design's 6 labels (no title field, no not-under-command/in-doubt case, has a stand-on-mirror duplicate); this phase's D-01/D-02/D-03 resolve that mismatch that Phase 8 explicitly deferred to Gallery
- `.planning/phases/08-sandbox/08-CONTEXT.md` deferred section — explicitly flagged "fixing the curated-scenario seed data" as "more naturally Phase 9's concern"
- `src/components/sandbox/chip-scenarios.ts` — the exact 6 labels/rules this phase's Gallery cards must match, plus the already-verified `notUnderCommandVessels`/`inDoubtVessels` geometry (D-02) to reuse rather than re-derive
- `.planning/phases/07-hero/07-CONTEXT.md` D-01–D-03 — the "static, independent illustrative SVG, never shares code with the live chart" precedent this phase's mini-chart (D-06–D-08) follows
- `src/components/hero/HeroPreviewCard.tsx`, `hero-preview-geometry.ts` — concrete precedent for building a fixture-driven static SVG chart; NOT to be reused directly (hardcoded to one fixture) but is the pattern to mirror in a parametrized form

### Pitfalls (Gallery-tagged) — already fully researched, no open user decision
- `.planning/research/PITFALLS.md` Pitfall 6 (line 120) — route-to-anchor migration: use `next.config.ts` `redirects()` with `{ source: "/gallery", destination: "/#gallery", permanent: true }`; keep the Gallery section server-rendered (not client-fetched) so `id="gallery"` exists at first paint (GAL-04); add `scroll-padding-top` (already set in Phase 6); test both fresh-tab navigation to `/gallery` AND an in-app `<Link href="/#gallery">` click — independent failure modes; add a client-side `scrollIntoView` fallback effect ONLY if manual testing shows the native behavior doesn't reliably land on `#gallery` — do not add it defensively up front

### Requirements & roadmap
- `.planning/REQUIREMENTS.md` — GAL-01 through GAL-04, full acceptance criteria
- `.planning/ROADMAP.md` §Phase 9 — success criteria; GAL-02's "same `/s/[shareId]` navigation as before" is already locked (clicking a card navigates to the existing `/s/[shareId]` page, which itself renders a `SandboxContainer` pre-seeded with that scenario — confirmed by reading `app/s/[shareId]/page.tsx`; this is NOT a new in-page state-lifting mechanism)
- `.planning/PROJECT.md` — locked v1.1 decisions (design followed exactly; dark-mode only)

### Existing route/data being replaced
- `app/gallery/page.tsx` — current standalone route (unstyled, plain `<Link href="/s/${row.id}">` cards); this phase moves its rendering logic onto the home page and replaces this file with a redirect
- `src/server/api/routers/gallery.ts` — `gallery.list()` tRPC query; unchanged contract, only the underlying `curated-scenarios.ts` data changes (D-01)
- `src/server/db/curated-scenarios.test.ts` — existing coverage tests (count 5–8, classifiability, encounter-type coverage, mirror-pair check) will need updating once entry #2's mirror pair is dropped (D-03) and the 2 new entries are added (D-02)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `app/gallery/page.tsx` — existing card-grid rendering logic (fetch via `getCaller().gallery.list()`, map to cards) to migrate into a new component composed into `app/page.tsx`
- `src/components/ui/card.tsx`, `badge.tsx` (shadcn, from Phase 6) — Gallery cards compose these, same as Hero/Sandbox
- `src/components/sandbox/chip-scenarios.ts` — source of the 6 exact labels/rules and 2 reusable vessel-geometry fixtures (D-02)
- `src/components/hero/hero-preview-geometry.ts` — geometry helpers (`chartToScreen` via `src/domain/geometry/screen-convert.js`, heading-vector endpoint, hull path constants) to mirror/reuse for the gallery mini-chart (D-06–D-09)
- `src/domain/colregs/classify-encounter.fixtures.ts` — existing fixture-literal pattern; likely destination for the 2 new shared vessel fixtures (D-02)

### Established Patterns
- Feature-first component folders (`hero/`, `sandbox/`) — a new `gallery/` folder (or extending an existing one) keeps markup/styling/logic separated, per this project's locked frontend conventions
- Server Component data fetching (`await getCaller().gallery.list()`) — already the pattern in `app/gallery/page.tsx`; GAL-04 requires keeping this exact pattern when the section moves onto the home page (not converting to client-side fetch)
- `app/page.tsx`'s current thin composition (`<Hero /><section id="sandbox"><SandboxContainer /></section>`) — this phase adds a third top-level section, likely `<section id="gallery">`, following the same shape

### Integration Points
- `app/page.tsx` — Gallery section composes in below the `#sandbox` section
- `app/gallery/page.tsx` — replaced with a redirect (or removed, with the redirect handled entirely by `next.config.ts`'s `redirects()` — resolve exact mechanism during planning per Pitfall 6's guidance)
- `next.config.ts` — new `redirects()` entry
- `src/server/db/curated-scenarios.ts` + `prisma/seed.ts` — updated seed data (D-01–D-03), reseeded locally (D-05)
- Header nav's existing `href="#gallery"` link (Phase 6) — currently a no-op; this phase makes it resolve to a real section for the first time

</code_context>

<specifics>
## Specific Ideas

Verbatim card copy from `Main-Design.png` (D-04):

| Card | Rule | Role badge | Title | Description |
|---|---|---|---|---|
| 1 | Rule 15 | A GIVES WAY | Classic crossing | Power-driven vessels on crossing courses; the one with the other to starboard keeps clear. |
| 2 | Rule 14 | MUTUAL | Head-on meeting | Reciprocal courses, each dead ahead of the other — both alter course to starboard. |
| 3 | Rule 13 | A GIVES WAY | Overtaking | A faster vessel comes up from abaft the beam and must keep clear. |
| 4 | Rule 18 | A GIVES WAY | Sailing has priority | A power-driven vessel keeps clear of a sailing vessel regardless of geometry. |
| 5 | Rule 18 | A GIVES WAY | Not under command | Every other vessel keeps out of the way of a vessel not under command. |
| 6 | Rule 7 | MUTUAL | In doubt | Near-reciprocal but ambiguous — assume a head-on situation exists and act accordingly. |

Section copy: eyebrow "Curated scenarios", heading "Classic encounters, one click away", subhead "Textbook COLREGS geometries. Load any into the sandbox and drag from there."

</specifics>

<deferred>
## Deferred Ideas

None new — discussion stayed within Phase 9's scope.

</deferred>

---

*Phase: 9-Gallery*
*Context gathered: 2026-07-19*
