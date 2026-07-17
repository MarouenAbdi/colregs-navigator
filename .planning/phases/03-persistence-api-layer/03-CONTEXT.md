# Phase 3: Persistence & API Layer - Context

**Gathered:** 2026-07-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Scenarios (raw two-vessel inputs — position, heading, speed, type — nothing else) become durably persistable via a Prisma schema and Postgres database, retrievable by a non-guessable share ID, and are exposed through thin `scenario` and `gallery` tRPC routers. Retrieving a scenario always re-runs `classifyEncounter()` (Phase 2) against the stored inputs at read time — the verdict itself is never stored or read back as-is. This is the first phase to introduce Next.js/tRPC/Prisma/Postgres into the repo (Phases 1–2 are pure domain, zero framework dependencies). No UI (Phase 4/5) and no real gallery content curation (Phase 5) — this phase only builds the persistence/API capability those phases will consume.

</domain>

<decisions>
## Implementation Decisions

### Database Provisioning
- **D-01:** Local development uses **Docker Postgres** (`docker-compose.yml`, `DATABASE_URL` pointing at localhost). Zero external account needed; any reviewer cloning the repo gets a fully reproducible setup. Prisma abstracts the connection, so a deploy target can later point at any managed Postgres without schema/code changes.
- **D-02:** **No live deployment for this milestone** — the project is demoed via README + local run instructions (or a screen recording), not a hosted live link. Do not provision Neon/Supabase or any hosted DB as part of this phase; setup docs should describe local Docker only.

### Scenario Schema Shape
- **D-03:** Vessel data is modeled as **flat columns on a single `Scenario` row** (`vesselAPosX`, `vesselAPosY`, `vesselAHeading`, `vesselASpeed`, `vesselAType`, and mirrored `vesselB*` columns) — not a JSON column and not a normalized related `Vessel` table. The two-vessel relationship is fixed (never 1-to-many), so normalization would add join complexity without benefit; flat columns keep every field fully typed and indexable in Postgres.
- **D-04:** Position is stored as **two separate float columns per vessel** (`vesselAPosX`, `vesselAPosY`), not an embedded JSON object — consistent with D-03 and avoids JSON parsing anywhere in the persistence layer.
- **D-05 (reaffirmed, not re-asked):** Share IDs use Prisma's default `cuid()`/`uuid()` — already locked in CLAUDE.md's Alternatives Considered table. `nanoid` is out of scope unless a short-URL requirement emerges later.
- **D-06:** No derived-verdict column or field anywhere in the schema (hard constraint from ROADMAP.md Phase 3 success criterion #1 — reaffirmed, not a new decision, but binding on schema design).

### Gallery Data Approach
- **D-07:** Phase 3 builds the **gallery capability only — no seed data**. A `gallery.list` tRPC procedure filters `Scenario` rows on `isCurated`, but no curated scenarios are seeded in this phase. Phase 5 owns selecting and writing the actual 5–8 textbook encounters (SCEN-03) — seeding placeholder data now risks it leaking into the eventual demo or requiring rework.
- **D-08:** Gallery entries are **not a separate `GalleryEntry` table** — `isCurated Boolean @default(false)` and `displayOrder Int?` live directly on `Scenario`. A gallery entry IS a scenario, just flagged; this matches SCEN-03's framing of gallery items as regular scenarios with rationale text, and avoids a join on every `gallery.list` call.
- **D-09:** Add a **nullable `rationale String?` field to `Scenario` now** (in this phase's migration), even though it stays unused/null for regular non-curated scenarios. Phase 5's SCEN-03 requires "brief rationale text per gallery entry" — adding the column now means one migration instead of two, and it's optional so it doesn't affect regular `scenario.create`/`scenario.get` behavior in this phase.

### Not-Found & Error Handling
- **D-10:** `scenario.get` throws a standard **`TRPCError({ code: 'NOT_FOUND' })`** when the repository returns null for a given share ID (deleted, typo'd, or malformed) — not a `Result`-style discriminated-union response. tRPC's own error channel is the idiomatic mechanism here; doubling it with a domain-style `Result<T>` envelope at the API boundary would mean checking two things per call site instead of one. (Phase 1/2's `Result<T>` pattern stays a domain-internal convention — it does not extend across the tRPC boundary.)
- **D-11:** `scenario.create`'s tRPC input schema **reuses Phase 1's domain `VesselSchema`/`PositionSchema` directly** (or a thin composition of them) rather than defining a separate tRPC-specific input schema. This is CLAUDE.md's explicitly stated pattern — Zod schemas act as the shared boundary contract between API validation and domain value objects, avoiding duplicate type definitions.

### Claude's Discretion
- Exact placement of the "always re-run `classifyEncounter()` on read" logic — whether it lives in an explicit application/use-case layer (`src/server/application/`), the repository, or the router itself. ROADMAP.md's Phase 3 goal names "application use cases" as a distinct layer from routers/repository, but this wasn't discussed explicitly — follow CLAUDE.md's Clean Architecture layering (`src/domain/` never imports from `src/server/`; routers are thin adapters) during planning/research.
- Prisma migration workflow specifics (e.g., `prisma migrate dev` vs `db push` during early development, whether migrations are checked into the repo) — not discussed; follow standard Prisma conventions for a project with a documented setup guide.
- Exact router/procedure naming and file layout within `src/server/api/` beyond "scenario and gallery routers" (already named in ROADMAP.md) — follow CLAUDE.md's `src/server/api/` (adapters) / `src/server/db/` (infra) folder shape.
- Rule 18 vessel-type Zod enum reuse: confirm during planning that Prisma's `vesselAType`/`vesselBType` columns use the same 5-value kebab-case union already locked in Phase 1 (D-12 there) rather than redefining it.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Tech stack & architecture decisions (locked)
- `CLAUDE.md` — Technology Stack section: locks Prisma/tRPC/Zod/Postgres as the persistence/API stack, the Zod-schema-as-shared-boundary-contract pattern (D-11), the `src/domain/` framework-free boundary rule, and the `src/server/api/` (adapters) / `src/server/db/` (infra) folder shape referenced in Claude's Discretion above. Also locks Prisma's default `cuid()`/`uuid()` over `nanoid` (D-05).

### Project scope & requirements
- `.planning/PROJECT.md` — Key Decisions table: "Scenarios are saveable/shareable via link, backed by Postgres/Prisma/tRPC; no auth" — confirms the tech choice this phase implements. Out-of-Scope list confirms no user accounts/auth.
- `.planning/REQUIREMENTS.md` — SCEN-02 (re-derive-on-read guarantee, the phase's sole mapped requirement); SCEN-01/SCEN-03 (Phase 5, referenced here only because Phase 3's schema must support them — see D-07–D-09).
- `.planning/ROADMAP.md` — Phase 3 section (goal, 4 success criteria, requirements mapping). Success criterion #1 ("no derived-verdict column") is a hard constraint on schema design (D-06).
- `.planning/STATE.md` — notes Phase 3 was merged from separately-proposed Persistence and tRPC API phases during roadmap creation, since both are "conventional, low-risk, HIGH-confidence patterns per research" — no deep research flag was raised for this phase (unlike Phase 2 and Phase 4).

### Prior phase context (Phases 1–2 — this phase persists their output, never re-derives it)
- `.planning/phases/01-domain-foundations/01-CONTEXT.md` — Locks the `Vessel`/`Position` Zod schemas (D-11: 5 kebab-case vessel types) that this phase's Prisma columns and tRPC input validation must mirror (D-11 here), and the axis convention (x=east, y=north) that `vesselAPosX`/`vesselAPosY` columns store directly.
- `.planning/phases/02-colregs-rules-engine/02-CONTEXT.md` — `classifyEncounter(vesselA, vesselB, previous?)` signature and its optional `previous` parameter (D-01 there) — relevant because `scenario.get`'s re-derivation call passes only the stored `vesselA`/`vesselB` and never a stored `previous` classification (there is no persisted classification to pass, per D-06/D-10 in this phase).

No other external specs, ADRs, or design docs exist for this phase.

</canonical_refs>

<code_context>
## Existing Code Insights

This phase is greenfield for persistence/API concerns: no `prisma/`, `src/server/`, or tRPC setup exists yet. `package.json` currently only has `zod`, `typescript`, `vitest` as dependencies — Next.js, `@trpc/server`/`client`, `@prisma/client`, and `prisma` (CLI) all need to be added in this phase.

### Reusable Assets
- `src/domain/vessel/vessel.ts` — `Vessel`, `Position`, `VesselType` Zod schemas. Direct source for the tRPC input schema (D-11) and the shape Prisma columns must mirror (D-03/D-04).
- `src/domain/colregs/` — `classifyEncounter()` (exact export path to confirm during scouting/planning) — the function `scenario.get` must call at read time (D-10, phase's core re-derivation guarantee).
- `src/domain/shared/result.ts` — `Result<T>` pattern — stays domain-internal per D-10; not extended to the tRPC boundary in this phase.

### Established Patterns
- Phases 1–2 both keep `src/domain/` with zero imports from frameworks — this phase's new `src/server/` code must call INTO `src/domain/`, never the reverse.
- Zod schemas double as both validation and domain value-object types (`z.infer<typeof VesselSchema>`) — this phase extends that same pattern to tRPC router inputs (D-11) rather than introducing a parallel schema set.

### Integration Points
- New `src/server/db/` (Prisma client + repository) and `src/server/api/` (tRPC routers) directories will be created in this phase — first time these paths exist.
- `docker-compose.yml` at repo root (new) for local Postgres (D-01).

</code_context>
</code_context>

<specifics>
## Specific Ideas

No particular UI/example references — Phase 3 is pure backend/persistence with no visual surface (chart/gallery UI is Phase 4/5). The concrete artifacts beyond code: a `docker-compose.yml` + setup-guide update describing local Postgres provisioning (D-01/D-02), and a Prisma migration that includes the `rationale`/`isCurated`/`displayOrder` fields Phase 5 will need (D-07–D-09) even though they stay unused until then.

</specifics>

<deferred>
## Deferred Ideas

- **Live hosted deployment (Neon/Supabase)** — considered during the Database Provisioning discussion and explicitly declined for this milestone (D-02). Revisit only if a future milestone decides a live demo link is worth the added setup/account overhead.
- **Curating the actual 5–8 gallery scenarios and rationale text** — belongs to Phase 5 (SCEN-03), not this phase (D-07).

None of these represent new capabilities outside the existing roadmap — both are already-scoped future-phase or future-milestone work, not scope creep.

</deferred>

---

*Phase: 3-Persistence & API Layer*
*Context gathered: 2026-07-17*
