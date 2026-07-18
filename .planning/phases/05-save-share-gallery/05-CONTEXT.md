# Phase 5: Save, Share & Gallery - Context

**Gathered:** 2026-07-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can save the scenario currently in the sandbox and receive a shareable link (no login required), and browse a curated gallery page of 5-8 classic textbook encounters (clean head-on, crossing, and overtaking cases) with brief rationale text per entry. Opening a shared link or a gallery entry loads the exact saved scenario and displays a freshly-recomputed verdict — never a stale cached one — reusing Phase 3's already-built re-derive-on-read guarantee (`scenario.get`/`gallery.list`) and Phase 4's sandbox UI. This is the first phase to wire the frontend to tRPC at all (no client-side tRPC/React Query setup exists yet) and the first to add routes beyond `/`. No new persistence schema work — Phase 3 already added `isCurated`/`rationale`/`displayOrder` to `Scenario` in anticipation of this phase.

</domain>

<decisions>
## Implementation Decisions

### Save/Share Flow
- **D-01:** Saving always creates a **brand-new scenario** via `scenario.create` — there is no update/overwrite-in-place semantics. Matches Phase 3's schema (no `scenario.update` mutation exists) and needs no ownership tracking, consistent with the no-auth constraint.
- **Claude's discretion:** Exact placement/styling of the save trigger and the immediate success feedback (inline copyable link vs. redirect to the share URL) — not discussed at that granularity; pick the simplest approach that fits the existing `SandboxContainer` header (which already has a "Reset Scenario" button, `04-06-PLAN.md`) during planning.
- **Claude's discretion:** Share link URL shape and whether a "Copy Link" button uses the Clipboard API or the link is just shown as selectable text — not discussed at that granularity; pick the simplest reasonable UX (a dedicated route like `/s/[shareId]` is the natural fit for Next.js App Router, but exact styling/interaction is planning's call).

### Shared/Gallery View Mode
- **D-02:** Opening a shared link or a gallery entry loads into the **same fully-editable `SandboxContainer`**, pre-seeded with the saved scenario's vessels instead of the default fixture — the user can keep dragging/experimenting from that starting point. A **visible banner/label** (e.g. "Viewing saved scenario — drag to explore") is shown so it's clear this isn't the blank default state. This reuses 100% of Phase 4's sandbox component rather than building a second read-only rendering mode.

### Gallery Curation & Seeding
- **D-03:** Curated gallery rows are inserted via a **Prisma seed script** (e.g. `prisma/seed.ts`), not through the public `scenario.create` mutation. `scenario.create`'s current input schema has no `isCurated`/`rationale`/`displayOrder` fields, and deliberately stays that way — extending the public mutation with admin-style fields would let any caller mark their own scenario as curated with no auth in place to prevent it. The seed script calls Prisma Client directly to set those three fields.
- **D-04:** The gallery covers **one clean case per core rule the reasoning trail distinguishes**: a textbook head-on, a give-way crossing, a stand-on crossing (the mirror view of the same encounter), an overtaking case, plus 1-2 Rule 18 vessel-type-priority examples (e.g. a power-driven vessel giving way to a fishing vessel). This directly showcases the domain-modeling depth the reasoning trail already computes, rather than curating visually-varied but logically-redundant scenarios.
- **D-05:** Rationale text per entry is **1-2 sentences, plain language** — names the encounter type and the one geometric fact that makes it unambiguous (e.g. "Vessel B is nearly dead ahead of Vessel A and closing — a clear head-on situation requiring both vessels to alter course to starboard."). Deliberately shorter/less rule-number-heavy than the reasoning trail panel itself, since the gallery card's job is to entice a click-through, not to duplicate the full trail.

### Claude's Discretion (not discussed)
- Gallery browsing layout (list vs. grid of cards, whether each card shows a mini-chart preview or is text-only) — not discussed this session; follow CLAUDE.md's SVG-first, no-canvas convention if a preview is built, and keep it simple (text + encounter-type badge is a reasonable default) if not.
- Exact wording of all 5-8 rationale texts and the specific vessel positions/headings/speeds/types for each curated scenario — D-04 sets the *shape* of the set (which rule/encounter types to cover) but not the literal seed data; author these during planning/execution using the existing domain fixtures (`classifyEncounter` fixture suite) as a starting point for known-good, doubt-free geometry.
- Route/file layout for the new gallery page and the share-link view (e.g. `app/gallery/page.tsx`, `app/s/[shareId]/page.tsx`) and the first-ever client-side tRPC/React Query wiring (`@trpc/react-query`/`@tanstack/react-query` are installed as dependencies but nothing in `app/`/`src/components/` currently uses them) — standard Next.js App Router + tRPC setup, not a vision decision.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Tech stack & architecture decisions (locked)
- `CLAUDE.md` — Technology Stack section: locks tRPC/Zod/Prisma for the API layer (already built in Phase 3) and the `src/domain/` framework-free boundary. No new tech decisions are needed for this phase — it consumes Phase 3's routers and Phase 4's sandbox component as-is.

### Project scope & requirements
- `.planning/PROJECT.md` — Active requirements: "User can save a scenario and get a shareable link (no login required)" and "User can browse a curated gallery of preset classic encounters"; Out of Scope confirms no user accounts/auth (informs D-01/D-03's no-ownership-tracking design).
- `.planning/REQUIREMENTS.md` — SCEN-01 (save/share link), SCEN-03 (curated gallery of 5-8 encounters); SCEN-02 (re-derive-on-read) already validated in Phase 3 and consumed here, not re-implemented.
- `.planning/ROADMAP.md` — Phase 5 section (goal, 3 success criteria, requirements mapping, `UI hint: yes`).
- `.planning/STATE.md` — Blockers/Concerns section carries forward non-blocking Phase 4 code-review findings (`04-REVIEW.md`: `ChartPanel` not flagging the degenerate/coincident-position case, silent revert on invalid speed input) flagged for cleanup before Phase 5 — not this phase's scope to fix unless planning decides otherwise, but worth being aware of since this phase reuses `ChartPanel`/`SandboxContainer` directly.

### Prior phase context (Phases 3-4 — this phase wires directly into their output, no new backend/UI architecture)
- `.planning/phases/03-persistence-api-layer/03-CONTEXT.md` — Locks the gallery schema shape (D-07/D-08/D-09: `isCurated`/`rationale`/`displayOrder` live directly on `Scenario`, no separate `GalleryEntry` table, no seed data was added in Phase 3 — deliberately deferred to this phase) and the `scenario.get`/`gallery.list` re-derive-on-read contract (D-10, SCEN-02) this phase's pages call directly.
- `.planning/phases/04-interactive-chart-sandbox/04-CONTEXT.md` — Locks `SandboxContainer`'s single `applyVesselUpdate` choke point and the default-scenario-seeding pattern (D-06 there) that D-02 here extends: seeding from a saved/shared scenario instead of the hardcoded default fixture is the same mechanism, just a different initial value.

No other external specs, ADRs, or design docs exist for this phase. No SPEC.md was found (`spec_loaded = false`) — this discussion covers both scope confirmation (from ROADMAP.md) and implementation decisions.

</canonical_refs>

<code_context>
## Existing Code Insights

This phase is greenfield for share/gallery pages and client-side tRPC wiring, but reuses substantial existing backend and UI code.

### Reusable Assets
- `src/server/api/routers/scenario.ts` — `scenario.create` (mutation) and `scenario.get` (query, throws `TRPCError NOT_FOUND`) already fully implemented and tested. This phase's save button calls `create`; the share-link page calls `get`.
- `src/server/api/routers/gallery.ts` — `gallery.list` query already implemented (filters `isCurated`, returns `[]` if none seeded — which is currently the case). This phase's gallery page calls this directly once D-03's seed script has run.
- `src/server/application/scenario-service.ts` — `createScenario`/`getScenario`/`listGallery` already re-run `classifyEncounter()` on every read (SCEN-02) and return `{ ...row, verdict }` — the share/gallery pages receive a ready-to-render verdict, no client-side classification needed.
- `src/components/sandbox/SandboxContainer.tsx` — Owns `vesselA`/`vesselB` state, currently hardcoded to seed from `crossingResidualBasicCase` (a fixture). D-02's "load into the same editable sandbox" decision means this component needs an optional initial-scenario prop/param instead of (or in addition to) the hardcoded fixture default — a targeted extension, not a rewrite.
- `prisma/schema.prisma` — `isCurated`, `displayOrder`, `rationale` fields already exist on `Scenario` (Phase 3, D-08/D-09), currently unused/null on every row. D-03's seed script is the first code to populate them.

### Established Patterns
- `src/server/db/scenario-repository.ts` — Plain module-level query functions (`create`, `findByShareId`, `findCurated`), no repository base class. A seed script (D-03) should call Prisma Client directly (or these existing functions where they fit) rather than introducing a new abstraction.
- Routers are thin adapters over `scenario-service.ts` with zero classification/Prisma logic inline — any new procedure this phase might need (unlikely; `create`/`get`/`list` already cover the flow) should follow the same shape.

### Integration Points
- `app/page.tsx` currently renders `<SandboxContainer />` with no props. This phase adds new routes — a share-link page (e.g. `app/s/[shareId]/page.tsx`) and a gallery page (e.g. `app/gallery/page.tsx`) — the first new routes in the repo beyond `/`.
- No client-side tRPC/React Query provider exists yet anywhere in `app/` or `src/components/` — `@trpc/react-query` and `@tanstack/react-query` are installed as dependencies (Phase 3) but unused on the client. This phase is the first to need a `TRPCProvider`/query client wired into `app/layout.tsx`.

</code_context>
</code_context>

<specifics>
## Specific Ideas

The rationale example given during discussion — "Vessel B is nearly dead ahead of Vessel A and closing — a clear head-on situation requiring both vessels to alter course to starboard." — sets the tone/length (D-05) for all curated gallery entries. No pixel-level mockups or other external visual references were provided; gallery browsing layout is left to planning (see Claude's Discretion above).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within Phase 5 scope. No scope-creep suggestions came up during this discussion.

</deferred>

---

*Phase: 5-Save, Share & Gallery*
*Context gathered: 2026-07-17*
