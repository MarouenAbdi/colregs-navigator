# Phase 8: Sandbox - Context

**Gathered:** 2026-07-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 8 (Sandbox) restyles the existing interactive chart, controls, and reasoning trail to match the design exactly, with zero regression to the underlying domain wiring or interaction model. It also adds one genuinely new interactive element the design introduces inside the Sandbox panel itself: a row of 6 preset scenario chips that load canned encounters directly into the live sandbox instance (in-place, no navigation) — a deliberate scope decision made during this discussion (see below), not a plain restyle. Requirements: SBOX-01 through SBOX-05 (see REQUIREMENTS.md).

</domain>

<decisions>
## Implementation Decisions

### Preset scenario chips (new interactive element, not in original SBOX-01..05 wording)
- **D-01:** The chip row ("Classic crossing", "Head-on meeting", "Overtaking", "Sailing has priority", "Not under command", "In doubt") is fully wired: clicking a chip loads that scenario's canned vessel data directly into the current `SandboxContainer` instance, in place, with no page navigation. This is a deliberate scope expansion beyond SBOX-01..05's original wording and beyond `research/FEATURES.md`'s earlier stance (which had flagged in-place preset-loading as deferred/out-of-scope) — the user chose to build it now rather than defer it.
- **D-02:** Clicking a chip is mechanically identical to the existing `handleReset()` path: full replace of both vessels' position/heading/speed/type from the chip's fixture, and a full clear of `previousEncounterTypeRef` (hysteresis reset) — not a partial/merged update. Any in-progress custom drag is discarded with no confirmation dialog, matching how Reset Scenario already behaves today.
- **D-03 (supersedes an earlier answer in this same discussion):** The 6 chips' vessel data are **new, standalone fixtures defined locally in the sandbox feature folder** — NOT sourced from `gallery.list()`/`src/server/db/curated-scenarios.ts`. This was corrected mid-discussion after inspecting the actual seed data: the current 6 curated scenarios don't match the design's 6 chip labels (no `not-under-command` vessel is used anywhere today; there's no distinct "in doubt"/Rule 7 case; one current entry is a stand-on-mirror duplicate the design doesn't show; there's no `title` field, only `rationale` prose). Since `curated-scenarios.ts` lives under `src/server/db/` and REQUIREMENTS.md locks "nothing here touches `src/domain/` or `src/server/`" for this milestone, reusing/extending that data was ruled out. The chosen pattern mirrors Hero's Phase 7 precedent (D-07 in `07-CONTEXT.md`): define new `Vessel` pair literals directly in the sandbox folder and call the existing `classifyEncounter()` against them client-side — zero changes to `src/domain/` or `src/server/`, full freedom to match the design's exact 6 labels/rule-badges/role-badges.
- **Note for research/planning:** the exact geometry values for the two genuinely new cases this requires — a `not-under-command` vessel-type example and a distinct near-doubt-boundary example (design shows Rule 7, mutual badge) — are a research/planning task, not a further user decision, same precedent as Hero's D-07 fixture-value derivation.

### Status pill under instrument readouts
- **D-04:** Build the status pill shown in the design ("● Passing clear — CPA 1.81 NM on present courses"), derived from `ClassificationResult.riskOfCollision`: when `false`, show a "Passing clear — CPA X.XX NM on present courses" style message; when `true`, show a distinct risk-flagged message. This is new UI copy, not present in any existing copywriting contract — exact wording for the `riskOfCollision: true` case is Claude's discretion (no domain change; purely a presentation-layer string, following the same "Claude drafts exact wording" precedent as the doubt-caveat strings in `ReasoningPanel.tsx`).
- **D-05:** The CPA/TCPA/range/bearing values the instrument-readout grid needs are derived at the UI layer (either by scanning `classification.trail[].facts` for the relevant keys, or by calling the same pure `relativeBearing()`/`cpa()` geometry functions directly against the current vessel state) — NOT by adding a new top-level field to `ClassificationResult` in `src/domain/colregs/types.ts`. Touching that file would violate the milestone's "zero change to domain logic" constraint; exact derivation approach is Claude's discretion during planning.

### Responsive stacking (below 900px, SBOX-05)
- **D-06:** No mobile mock exists for this section (design image is desktop-only). Below 900px, the three panels stack in this order top-to-bottom: **Chart → Reasoning (instrument readouts + trail) → Controls** (vessel type/speed cards last). Matches the desktop visual priority (chart is the hero element, then the explanation, then the input controls).

### Claude's Discretion
- Exact geometry/vessel values for the new `not-under-command` and near-doubt-boundary chip fixtures (D-01/D-03) — derive during planning, same precedent as Hero's D-07.
- Exact wording of the status pill's risk-flagged (`riskOfCollision: true`) message (D-04) — the passing-clear message's wording is dictated by the design mock; the risk-true counterpart is not shown in the mock and needs original copy.
- Exact mechanism for deriving instrument-readout values (facts-trail scan vs. direct geometry-function call) (D-05).
- Component boundary/structure for splitting the current single `ReasoningPanel` aside into the design's separate verdict-banner card, instrument-readouts card, and numbered reasoning-trail card — dictated by "design followed exactly," not a user preference call.
- Exact shadcn primitives composed (Select, Slider, Card, Badge, Tabs-or-button-group for the chip row) — resolve during planning per `research/STACK.md`'s component-mapping table.
- Whether new Vitest/RTL tests are added for the chip-click interaction (beyond SBOX-04's required updates to existing drag/control tests) — expected given the project's TDD-where-practical testing approach, but exact coverage shape is an implementation call.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design source of truth
- `.planning/design/Main-Design.png` — the Sandbox section (below the Hero, above the Gallery cards) is the exact visual target: eyebrow "Interactive sandbox · night-display mode" + heading + subhead, "Reset scenario" button, the 6-chip preset row, the verdict-banner card (Rule badge + title + role badges), the chart + "1 NM" scale legend, the instrument-readouts card (Range/Bearing A-B/CPA/TCPA) + status pill, the numbered reasoning-trail card, and the two vessel-control cards (Type select, Speed slider, read-only Heading display)
- `.planning/design/claude-design-prompt.json` — original design brief (color system, typography, motion philosophy)

### Architecture
- `.planning/research/ARCHITECTURE.md` §"Sandbox" (line ~266) — restyle scope: `SandboxContainer.tsx`, `ControlPanel.tsx`, `ReasoningPanel.tsx`, `CopyLinkButton.tsx` JSX/markup only, logic/hooks/types unchanged; optional `useSandboxState.ts` extraction hook
- `.planning/research/ARCHITECTURE.md` §"Anti-Pattern 4" (line ~232) — `ChartPanel.tsx` hardcodes light-theme hex literals (`GRID_STROKE`, `BEARING_LINE_DEFAULT_STROKE`, `CONE_DEFAULT_STROKE`, `bg-white border-slate-200`, etc.) that MUST be re-themed against the new dark palette — the single highest-risk visual regression in this phase
- `.planning/research/ARCHITECTURE.md` §"role/badge duplication" (line ~152) — `ChartPanel.tsx`'s `HULL_FILL_CLASS`/`ROLE_BADGE_TEXT` and `ReasoningPanel.tsx`'s own separate `ROLE_BADGE`/`VESSEL_LABEL_TEXT` describe the same concepts twice; consolidate into the existing `src/components/sandbox/vessel-role.ts` (already the single shared source for role derivation) while restyling
- `.planning/research/ARCHITECTURE.md` §dependency rules (line ~248) — `sandbox/` may import `ui/*` and `shared/*` one-directionally; must NOT introduce a new tRPC call to `src/server/db/curated-scenarios.ts`/`gallery.list()` for the chip data (per D-03 above)

### Stack
- `.planning/research/STACK.md` §component mapping (lines 108-117) — Select (vessel type), Slider (speed, controlled `value`/`onValueChange` array), Card (reasoning-trail/instrument-readout containers), Badge (give-way/stand-on/mutual role indicators), Input/Label (if needed)
- `.planning/research/STACK.md` line 108 — treat every native `<select>`→`Select` and native number/range input→`Slider` swap as a **test rewrite**, not a test fix (`findByRole` async pattern for portal-mounted `SelectContent`)

### Pitfalls (Sandbox-tagged)
- `.planning/research/PITFALLS.md` Pitfall 1 / line 20 — mandatory **manual drag+rotate UAT pass in a real browser** before merging this phase's PR, not just a green `npm test` run (jsdom cannot detect a hit-testing regression)
- `.planning/research/PITFALLS.md` line 108-116 — Radix `Select`/`Slider` test rewrite pattern; watch for `target.hasPointerCapture is not a function` / `scrollIntoView is not a function` under Vitest
- `.planning/research/PITFALLS.md` line 200 — hardcoded hex color literals in `ChartPanel.tsx` won't show up in a `dark:`/shadcn-token-name search; search specifically for hex-literal strings (`#[0-9A-Fa-f]{3,6}`) as a done-checklist item
- `.planning/research/PITFALLS.md` line 228-236 — Sandbox-phase done-checklist: hit-testing regression check, `@theme` token registration check, hex-literal search, vessel-badge contrast check against the new dark chart background

### Requirements & roadmap
- `.planning/REQUIREMENTS.md` — SBOX-01 through SBOX-05, full acceptance criteria; also note the milestone-wide "nothing here touches `src/domain/` or `src/server/`" boundary that shaped D-03/D-05 above
- `.planning/ROADMAP.md` §Phase 8 — success criteria, Phase 6 dependency (dark tokens, `ui/*` primitives)
- `.planning/PROJECT.md` — locked v1.1 decisions (design followed exactly; dark-mode only)
- `.planning/research/FEATURES.md` line 109/121 — the earlier (now superseded, per D-01) stance that in-place preset-loading was deferred/out-of-scope; downstream agents should know this discussion explicitly overrode that stance for the chip row specifically, not as a general precedent for other in-place-loading ideas

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/sandbox/SandboxContainer.tsx` — `applyVesselUpdate()` is the single choke point every update (drag, form change, reset) already funnels through; the new chip-click handler should call this same function (or `handleReset()`'s pattern) rather than introducing a parallel state-update path
- `src/components/sandbox/vessel-role.ts` — existing shared role-derivation module; extend here (not in `ChartPanel.tsx`/`ReasoningPanel.tsx` separately) per the ARCHITECTURE.md consolidation note
- `src/domain/colregs/classify-encounter.fixtures.ts` — existing fixture-literal pattern (`Vessel` pairs with inline worked-math comments) to mirror for the new sandbox-local chip fixtures, without adding to this file itself
- `src/components/hero/hero-preview-geometry.ts` (Phase 7 precedent) — shows the established pattern of a pure, framework-free computation module separated from JSX presentation; the chip fixture data + label/rule mapping should follow the same shape

### Established Patterns
- Semantic domain color tokens (give-way/stand-on/mutual) already registered under Tailwind v4 `@theme` in Phase 6 — reuse for role badges, chip active-state, and status pill coloring
- `SandboxContainer` → `ChartPanel`/`ControlPanel`/`ReasoningPanel` prop-drilling pattern (no zustand) — the chip row's selection state and click handler should follow the same lifted-state-in-container pattern, not introduce new shared state machinery
- Feature-first component folders (per Phase 7's conventions doc) — split derived computation (chip fixture data, status-pill copy logic, instrument-readout derivation) into pure `.ts` modules separate from the restyled `.tsx` presentation components

### Integration Points
- `ChartPanel.tsx`'s hardcoded light-theme hex constants (see canonical_refs above) are the primary integration risk — must be re-themed as part of this phase, not assumed to be a wrapper-only `Card` restyle
- `ControlPanel.tsx`'s native `<input type="number">` and `<select>` become `Slider`/`Select`; `ControlPanel.test.tsx` needs a full interaction-pattern rewrite (click + `findByRole`), not incremental fixes
- New: a chip-row component + its fixture/label data module, wired into `SandboxContainer`'s existing `applyVesselUpdate`/hysteresis-reset pattern

</code_context>

<specifics>
## Specific Ideas

- Chip labels, in order, per the design: "Classic crossing" (active/default, Rule 15, A gives way), "Head-on meeting" (Rule 14, mutual), "Overtaking" (Rule 13, A gives way), "Sailing has priority" (Rule 18, A gives way), "Not under command" (Rule 18, A gives way), "In doubt" (Rule 7, mutual)
- Verdict banner: `Rule 15` badge + `Crossing` title + one-line plain-English description + two role badges ("Vessel A · GIVE WAY" red, "Vessel B · STAND ON" teal/green) in a full-width card above the chart
- Instrument readouts: 2×2 grid — RANGE (NM), BEARING A→B (degrees), CPA (NM), TCPA (min) — plus the status pill below the grid
- Reasoning trail: numbered steps (1 Geometry, 2 Rule N, 3 Verdict) each with a colored number/dot, a colored tag label (GEOMETRY/RULE N/VERDICT), and a connecting vertical line down the left edge
- Vessel control cards: letter-chip + "Vessel A/B" heading + role badge in the card header row; TYPE select; SPEED slider with live numeric readout; read-only HEADING display (no new editable heading control — heading stays drag-only on the chart, matching current behavior)
- Chart adds a small "1 NM" scale-bar legend (bottom-left) not present in the current `ChartPanel.tsx`

</specifics>

<deferred>
## Deferred Ideas

None new beyond the reviewed-not-folded item below — discussion stayed within Phase 8's (expanded) scope.

### Reviewed Todos (not folded)
- "Embed gallery on home page instead of separate route" (`.planning/todos/pending/2026-07-18-embed-gallery-on-home-page-instead-of-separate-route.md`) — matched Phase 8 by keyword overlap during todo cross-reference (score 0.7), but this is explicitly Phase 9's (Gallery) concern per ROADMAP.md/REQUIREMENTS.md (GAL-01 through GAL-04). Not folded — Phase 8's chip row is a separate, sandbox-local feature and does not touch the `/gallery` route or its removal.
- Fixing the curated-scenario seed data itself (adding a `title` field, `not-under-command`/`in-doubt` fixtures to `src/server/db/curated-scenarios.ts`) so the *actual Gallery cards* Phase 9 builds match the design's 6 labels exactly — surfaced during this discussion (see D-03) but explicitly deferred: it touches `src/server/`, which is out of this milestone's locked boundary, and is more naturally Phase 9's concern if the Gallery cards are found to have the same label mismatch when that phase is discussed.

</deferred>

---

*Phase: 8-Sandbox*
*Context gathered: 2026-07-18*
