# Phase 8: Sandbox - Research

**Researched:** 2026-07-18
**Domain:** shadcn/ui restyle of an existing interactive SVG chart + form controls + reasoning-trail panel, plus a new client-side preset-scenario chip row (Next.js 16 / React 19 / Tailwind v4 / Radix / Vitest)
**Confidence:** HIGH (grounded in direct reads of every file this phase touches, the actual design mock, and the project's own prior `ARCHITECTURE.md`/`STACK.md`/`PITFALLS.md` research; MEDIUM/LOW flagged inline for anything not directly verified)

## Summary

Phase 8 is 90% a presentation-layer restyle of already-working, already-tested code (`SandboxContainer.tsx`, `ControlPanel.tsx`, `ReasoningPanel.tsx`, `ChartPanel.tsx`) and 10% a genuinely new feature: a 6-chip preset-scenario row wired to `applyVesselUpdate()`, plus a status pill and instrument-readout grid that must be derived at the UI layer without touching `src/domain/colregs/types.ts`. Direct inspection of `ChartPanel.tsx` shows it has **already been partially re-themed** (grid/cone strokes carry "was slate-X, a light-canvas color" comments and the SVG background is already `#0B0B0E`) — `PITFALLS.md`'s hex-literal list is now partially stale; this research re-audits the file directly and lists exactly what still needs re-theming (see Common Pitfalls, Pitfall S1). The give-way/stand-on/mutual **semantic color tokens `STATE.md`/`08-CONTEXT.md` describe as "already registered under Tailwind v4 `@theme` in Phase 6" do not exist** in `app/globals.css` — this is a correction the planner needs (see Pitfall S2).

The two fixtures CONTEXT.md flags as needing fresh derivation (`not-under-command` Rule 18 override, and a distinct-feel near-doubt-boundary case) are fully worked out below with exact `Vessel` literals, verified against a line-by-line JS reimplementation of `relative-bearing.ts`/`cpa.ts`/`classify-encounter.ts`'s actual formulas. The other four chips need **zero new derivation** — each is a straight relabeling or type-swap of an already-existing, already-tested fixture in `classify-encounter.fixtures.ts` (values may be copied as new literals into the sandbox-local module; do not import from that file, per D-03).

The instrument-readout question (facts-trail scan vs. direct geometry calls) has a clear answer: **call `relativeBearing()`/`cpa()` directly** — the facts-trail approach cannot reliably supply these values across all code paths (the sticky-overtaking hysteresis trail entry has empty `facts: {}`; a `no-closure` cpa result never gets `tcpaMinutes`/`dcpaNm` attached to any trail entry; and "Range" — plain current distance — is not computed by any domain function at all, `cpa()`'s success path never returns it).

**Primary recommendation:** Restyle `ChartPanel`/`ControlPanel`/`ReasoningPanel`/`SandboxContainer` markup-only per the existing `ARCHITECTURE.md` file-by-file plan; add the give-way/stand-on/mutual `@theme` tokens (missing, contra `08-CONTEXT.md`'s assumption) as part of this phase; add a new pure `src/components/sandbox/chip-scenarios.ts` module holding the 6 new `Vessel`-pair literals (using the exact values below) plus a new pure `src/components/sandbox/instrument-readouts.ts` module that calls `relativeBearing()`/`cpa()` directly against live vessel state (requires widening `ReasoningPanelProps`/or a new sibling component's props to include `vesselA`/`vesselB`, which it currently lacks).

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Chart rendering, hull/rotate-handle drag hit-testing | Browser / Client (SVG + Pointer Events) | — | Already implemented in `ChartPanel.tsx`; restyle only, no tier change |
| Vessel type/speed form controls | Browser / Client (shadcn `Select`/`Slider`) | — | `ControlPanel.tsx` is a controlled, presentational client component; restyle only |
| Encounter classification (Rule 7→13→14→15→18) | Domain (pure TS, `src/domain/colregs/`) | — | UNTOUCHED this milestone — `classifyEncounter()` stays exactly as-is |
| Preset-chip scenario data + click handler | Browser / Client (`src/components/sandbox/`) | Domain (calls `classifyEncounter()` client-side, read-only) | New feature this phase; sandbox-local, no server round-trip, no `src/domain/`/`src/server/` edits (D-03) |
| Instrument-readout derivation (Range/Bearing/CPA/TCPA) | Browser / Client (new pure `.ts` module in `sandbox/`) | Domain (calls existing `relativeBearing()`/`cpa()` — read-only) | Presentation-layer derivation only; `ClassificationResult`'s shape must not change (D-05) |
| Status-pill copy (Passing clear / risk-flagged) | Browser / Client (presentation string logic) | — | Reads `classification.riskOfCollision` (existing field) — no domain change (D-04) |
| Reasoning-trail rendering (numbered steps, tags, connecting line) | Browser / Client | — | Pure JSX restyle of `classification.trail`, same order/content (SBOX-03) |
| Responsive stacking (900px/640px) | Browser / Client (CSS/Tailwind breakpoints) | — | Layout-only concern, no logic change (SBOX-05) |

## User Constraints (from CONTEXT.md)

<user_constraints>

### Locked Decisions

- **D-01:** The chip row ("Classic crossing", "Head-on meeting", "Overtaking", "Sailing has priority", "Not under command", "In doubt") is fully wired: clicking a chip loads that scenario's canned vessel data directly into the current `SandboxContainer` instance, in place, with no page navigation. This is a deliberate scope expansion beyond SBOX-01..05's original wording.
- **D-02:** Clicking a chip is mechanically identical to the existing `handleReset()` path: full replace of both vessels' position/heading/speed/type from the chip's fixture, and a full clear of `previousEncounterTypeRef` (hysteresis reset) — not a partial/merged update. Any in-progress custom drag is discarded with no confirmation dialog.
- **D-03 (supersedes an earlier answer):** The 6 chips' vessel data are **new, standalone fixtures defined locally in the sandbox feature folder** — NOT sourced from `gallery.list()`/`src/server/db/curated-scenarios.ts`, and NOT added to `classify-encounter.fixtures.ts`. Zero changes to `src/domain/` or `src/server/`. Mirrors Hero's Phase 7 D-07 precedent: new `Vessel` pair literals + client-side `classifyEncounter()` calls.
- **Note for research/planning:** the exact geometry for the two genuinely new cases (`not-under-command`, near-doubt-boundary) is a research/planning task, not a further user decision.
- **D-04:** Build a status pill ("● Passing clear — CPA 1.81 NM on present courses"), derived from `ClassificationResult.riskOfCollision`: `false` → "Passing clear..." style message; `true` → a distinct risk-flagged message. New UI copy; exact wording for the `true` case is Claude's discretion.
- **D-05:** CPA/TCPA/range/bearing values are derived at the UI layer (either scanning `classification.trail[].facts`, or calling `relativeBearing()`/`cpa()` directly against current vessel state) — NOT by adding a field to `ClassificationResult`. Exact mechanism is Claude's discretion.
- **D-06:** No mobile mock exists (design image is desktop-only). Below 900px, panels stack top-to-bottom: **Chart → Reasoning (instrument readouts + trail) → Controls**.

### Claude's Discretion

- Exact geometry/vessel values for the new `not-under-command` and near-doubt-boundary chip fixtures — derive during planning, same precedent as Hero's D-07. **(Resolved below — see Code Examples.)**
- Exact wording of the status pill's risk-flagged (`riskOfCollision: true`) message.
- Exact mechanism for deriving instrument-readout values (facts-trail scan vs. direct geometry-function call). **(Resolved below — recommend direct geometry calls.)**
- Component boundary/structure for splitting the current single `ReasoningPanel` aside into the design's separate verdict-banner card, instrument-readouts card, and numbered reasoning-trail card — dictated by "design followed exactly."
- Exact shadcn primitives composed (Select, Slider, Card, Badge, Tabs-or-button-group for the chip row).
- Whether new Vitest/RTL tests are added for the chip-click interaction (beyond SBOX-04's required updates to existing drag/control tests).

### Deferred Ideas (OUT OF SCOPE)

- None new beyond reviewed-not-folded items: "Embed gallery on home page instead of separate route" is Phase 9's concern, not Phase 8's. Fixing the curated-scenario seed data (`src/server/db/curated-scenarios.ts`) so Gallery's cards match the design's 6 labels is explicitly deferred — it touches `src/server/`, out of this milestone's locked boundary, and is Phase 9's concern if relevant.

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SBOX-01 | Chart restyled to dark theme exactly; drag/rotate hit-testing must not regress (manual browser UAT required) | See Common Pitfalls Pitfall S1 (hex-literal re-audit) and cited `PITFALLS.md` Pitfall 1 (hit-testing contract) — `HULL_FILL_CLASS`/rotate-handle `fill` values must stay non-`"none"` |
| SBOX-02 | Vessel controls + verdict banner restyled with shadcn Select/Slider/Card/Badge, same classification behavior | See Code Examples (Select/Slider controlled-value API via Context7) and Architecture Patterns (grid layout finding) |
| SBOX-03 | Reasoning trail restyled (numbered steps, colored tags/dots, connecting line), same content/order | See Architecture Patterns Pattern 3 (trail rendering restructure) — `classification.trail` order/content is untouched, only JSX wrapping changes |
| SBOX-04 | Existing Vitest/RTL tests updated for shadcn/Radix primitive swap, still pass | See Code Examples (test-rewrite pattern: click + `findByRole`) |
| SBOX-05 | Responsive layout: stacked single-column <900px, stacked controls <640px | See Architecture Patterns Pattern 1 (2-column-to-1-column grid + D-06 stack order) |
| (scope addition) Chip row (D-01–D-03) | 6 preset chips, in-place load via `applyVesselUpdate`/`handleReset` pattern | See Code Examples — full worked geometry for all 6 fixtures |
| (scope addition) Status pill (D-04) | Derived from `riskOfCollision`, new copy | See Common Pitfalls / Code Examples (status-pill derivation) |
| (scope addition) Instrument readouts (D-05) | Range/Bearing/CPA/TCPA without touching `ClassificationResult` | See Summary + Code Examples (recommended derivation module) |

</phase_requirements>

## Standard Stack

This phase adds no new npm packages beyond what `research/STACK.md` already locked for the whole v1.1 milestone (`radix-ui@1.6.2` via `shadcn`, already installed; `--base radix` already configured in `components.json` as `"style": "radix-nova"`, confirmed by direct read). What Phase 8 specifically needs from that stack, not yet present in `src/components/ui/`:

| Primitive | Present in `src/components/ui/`? | Action |
|-----------|-----------------------------------|--------|
| `Button`, `Card`, `Badge` | ✓ (already generated, used by Hero/Scaffolding) | Reuse as-is |
| `Select` | ✗ | `npx shadcn@latest add select` |
| `Slider` | ✗ | `npx shadcn@latest add slider` |
| `Input`, `Label` | ✗ | `npx shadcn@latest add input label` (only if a raw numeric input is still needed anywhere; per the design mock, speed is Slider-only with a live text readout, not a numeric `<Input>` — verify no `Input` is actually needed before adding it) |

[VERIFIED: repo file read — `src/components/ui/` currently contains only `badge.tsx`, `button.tsx`, `card.tsx`]

No new fixtures/data libraries, no new state-management library (chip-row selection state follows the existing lifted-state-in-`SandboxContainer` pattern per `ARCHITECTURE.md` — no zustand).

## Package Legitimacy Audit

Not applicable — this phase installs zero new npm packages. The `shadcn add select slider` commands only vendor additional `.tsx` source files under `src/components/ui/`, drawing from the same already-audited `radix-ui@1.6.2` dependency the Scaffolding phase already installed (see `research/STACK.md`'s own audit). No new `package.json` entries are introduced by this phase.

## Architecture Patterns

### System Architecture Diagram (Sandbox restyle + chip flow)

```
[User clicks a preset chip]                    [User drags hull / rotate handle]        [User changes Select/Slider]
        │                                                │                                        │
        ▼                                                ▼                                        ▼
chip-scenarios.ts lookup                         useHullDrag / useRotateHandleDrag        ControlPanel onChange
   (new Vessel pair)                             (screenToChart, unchanged)                (unchanged)
        │                                                │                                        │
        └───────────────────┬────────────────────────────┴────────────────────────────────────────┘
                             ▼
              SandboxContainer.applyVesselUpdate(nextA, nextB)
              (D-02: chip click also clears previousEncounterTypeRef, same as handleReset)
                             │
                    VesselSchema.safeParse (unchanged)
                             │
                    classifyEncounter(nextA, nextB, previous)  ← src/domain, UNCHANGED
                             │
                    ClassificationResult { encounterType, riskOfCollision, giveWay,
                                            standOn, doubt, doubtBoundary, trail }
                             │
        ┌────────────────────┼─────────────────────────────────────┐
        ▼                    ▼                                     ▼
  ChartPanel            instrument-readouts.ts                ReasoningPanel
  (roles/colors,        (NEW: calls relativeBearing()/cpa()   (verdict banner,
   restyled)             directly against vesselA/vesselB —   role badges, status
                         NOT a trail-facts scan — see below)   pill, numbered trail)
```

### Recommended Project Structure (delta from `ARCHITECTURE.md`'s existing plan)

```
src/components/sandbox/
├── ChartPanel.tsx              # restyle: re-theme remaining hex literals (Pitfall S1)
├── chart-rendering.ts          # NEW (already planned in ARCHITECTURE.md) — extracted wedgePath/buildGridLines/CHART_VIEW_BOX
├── ControlPanel.tsx            # restyle: native <select>/<input> → shadcn Select/Slider
├── ReasoningPanel.tsx          # restyle + likely split (see Pattern 3 below)
├── instrument-readouts.ts      # NEW — pure fn: (vesselA, vesselB) => {rangeNm, bearingAtoBDeg, cpaNm, tcpaMinutes} | null
├── status-pill.ts              # NEW — pure fn: (riskOfCollision, cpaNm) => {text, tone}
├── chip-scenarios.ts           # NEW — the 6 chip Vessel-pair literals + labels (see Code Examples)
├── SandboxContainer.tsx        # restyle + new handleChipSelect() alongside existing handleReset()
├── vessel-role.ts              # EXTEND — consolidate HULL_FILL_CLASS/ROLE_BADGE_TEXT/ROLE_BADGE/VESSEL_LABEL_TEXT here (Pattern 3, ARCHITECTURE.md)
├── types.ts                    # EXTEND — ReasoningPanelProps (or new sibling component props) needs vesselA/vesselB for instrument-readouts
├── CopyLinkButton.tsx          # restyle only
└── hooks/                      # reuse verbatim, unchanged
```

### Pattern 1: Two-column desktop grid (chart | reasoning), full-width controls row below — NOT the current 3-equal-column flex row

**What:** The design mock (confirmed via direct image inspection, `.planning/design/Main-Design.png`) lays the Sandbox section out as: verdict-banner card (full width) → a 2-column row (Chart on the left, ~55-60% width; a "Reasoning" column on the right ~40-45% width containing the Instrument Readouts card + status pill + numbered Reasoning Trail card, stacked vertically) → a full-width row of 2 vessel-control cards below. This is **not** the current `SandboxContainer.tsx`'s `<div className="flex flex-row gap-8 items-start">` wrapping `ChartPanel`/`ControlPanel`/`ReasoningPanel` as three equal flex siblings.

**When to use:** Apply this exact 2-col-then-full-width grid for desktop (≥900px). Below 900px (D-06), collapse to a single column stacked Chart → Reasoning → Controls.

**Example (Tailwind grid sketch, verified against the design mock's proportions):**
```tsx
<div className="grid grid-cols-1 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-6">
  <ChartPanel {...chartProps} />
  <div className="flex flex-col gap-4"> {/* the "Reasoning" column */}
    <VerdictBanner {...verdictProps} />      {/* or keep verdict banner full-width above the grid, per mock */}
    <InstrumentReadouts {...readoutProps} />
    <ReasoningTrail {...trailProps} />
  </div>
</div>
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
  <VesselControlCard label="vesselA" ... />
  <VesselControlCard label="vesselB" ... />
</div>
```
Confirm the verdict-banner card's exact placement (full-width above the 2-col grid, as seen in the mock) vs. inside the reasoning column — the mock places it full-width, spanning both columns.

**Trade-offs:** This is a real structural JSX change to `SandboxContainer.tsx` (not just a `<Card>` wrapper), consistent with `ARCHITECTURE.md`'s own note that `SandboxContainer.tsx`/`ReasoningPanel.tsx` are "Restructure (moderate)", not a trivial restyle.

### Pattern 2: Chip row as a controlled button/toggle group, not a new `Tabs` component

**What:** The design's 6-chip row ("Classic crossing" shown active/teal-filled, the rest neutral/outlined pill buttons) is a **selection of one scenario to load**, not persistent tabbed content — clicking a chip performs a one-shot state replacement (D-02), it doesn't switch which panel is visible. `research/STACK.md`'s own guidance is explicit: "Tabbed content... only add if the mockup actually shows tabs — don't add speculatively." This is not tabs; it is a row of `Button`-like pills, each `onClick`-wired to `handleChipSelect(chipId)`.

**When to use:** Compose from `Button` (or plain styled `<button>`s if `Button`'s default variants don't match the pill shape) with an `aria-pressed`/active-state class keyed to "which chip produced the vessels currently loaded" — track this as local `SandboxContainer` state (`const [activeChipId, setActiveChipId] = useState<string | null>(initialChipId)`), reset to `null` whenever a manual drag/form edit diverges from the chip's canonical values (optional nice-to-have; not required by D-01/D-02, which only specify the load behavior, not lingering "active" tracking after a manual edit — Claude's discretion whether to bother invalidating the active-chip highlight on manual edits).

**Trade-offs:** Radix's `Tabs`/`ToggleGroup` would add unneeded ARIA semantics (tabpanel switching) for what is actually a one-shot data-load action — a plain button row with a data-driven active class is simpler and matches STACK.md's "don't add speculatively" guidance.

### Pattern 3: Split `ReasoningPanel` into 3 sub-cards, matching the design 1:1

**What:** The design shows 3 visually distinct cards where `ReasoningPanel.tsx` currently renders one `<aside>`: (1) verdict banner (Rule badge + title + description + 2 role badges), (2) instrument readouts (2×2 grid + status pill), (3) numbered reasoning trail (numbered circles with colored dot/tag, connecting vertical line, text). Confirmed via direct image inspection — reasoning trail numbers are colored circles (`1` teal "GEOMETRY" tag, `2` teal "RULE 15" tag, `3` red "VERDICT" tag) connected by a vertical line down the left edge, each with body text below.

**When to use:** Split into 3 sub-components (e.g. `VerdictBanner.tsx`, `InstrumentReadouts.tsx`, `ReasoningTrail.tsx`) all still fed by the same `ClassificationResult` (`classification.encounterType`/`giveWay`/`standOn` → VerdictBanner; `classification.trail` → ReasoningTrail numbered list; `vesselA`/`vesselB` + `classification` → InstrumentReadouts, which needs the new vessel-state props). Keep `ReasoningPanel.tsx` (or rename it) as a thin composing wrapper, or fold it away entirely if `SandboxContainer.tsx` composes the 3 new components directly — either is consistent with "component boundary is Claude's discretion, dictated by the design."

**Trail tag → rule-badge mapping, observed exactly from the design mock:** step 1 is tagged "GEOMETRY" (not a rule ID) even though its text states raw bearing/range facts; step 2 is tagged with the actual matched rule ("RULE 15"); step 3 is tagged "VERDICT". This is a **3-step simplified/curated trail for the chip's default view**, not a literal 1:1 render of every one of `classification.trail`'s raw entries (the real `classifyEncounter()` output pushes 3-5 raw entries per encounter, e.g. Rule 7, Rule 13(a)-(b), Rule 14(a)-(b), Rule 15, Rule 18(a)-(c) for a crossing case — more than 3). **Flag as Open Question:** either (a) render all of `classification.trail`'s real entries with a "GEOMETRY"/rule-id/"VERDICT" tag derived per-entry (first entry → GEOMETRY, middle entries → their own `ruleId`, last entry → VERDICT), which changes step count per scenario (matches SBOX-03's literal requirement — same content/order as today, just restyled), or (b) curate/collapse the trail to always show exactly 3 steps matching the mock pixel-for-pixel (risks silently dropping real trail content, likely violating SBOX-03's "no change to content/order"). **Recommend (a)**: SBOX-03 explicitly requires no content/order change, so tag-mapping should be derived from the real trail's length, not hardcoded to 3 steps; the mock's exact "3 steps" badge count is illustrative of its own default scenario (crossing has 3 substantive stages after collapsing Rule 7's binary gate into the tag), not a hard requirement.

### Anti-Patterns to Avoid

- **Scanning `classification.trail[].facts` for CPA/TCPA/bearing:** Fragile across code paths — the sticky-overtaking (`Rule 13(d)`) trail entry has `facts: {}` (no bearing recorded), and a `cpa()` "no-closure" result never attaches `tcpaMinutes`/`dcpaNm` to any trail entry at all. "Range" (plain Euclidean distance) is never computed by any domain function in the success path — it cannot be scanned for at all. Use direct geometry-function calls instead (see Code Examples).
- **Hardcoding the reasoning-trail step count to 3:** The design mock shows 3 steps for its own default (crossing) scenario; other encounter types (head-on, overtaking, Rule-18-override cases) produce different real trail lengths. Render `classification.trail`'s actual length, not a fixed 3.
- **Treating the "In doubt" chip's "Rule 7" badge as a literal `ruleId` match:** `classify-encounter.ts` never emits a trail entry with `ruleId: "Rule 7"` as the *classifying* stage for a head-on/doubt case (Rule 7 only appears as the Stage-1 risk-gate entry, always first). The design's "Rule 7" verdict-badge label for the "In doubt" chip is a presentation-layer choice — likely: when `classification.doubt === true`, show a badge reading "Rule 7" (referencing Rule 7(a)'s "when in doubt..." doctrine) instead of the actual classifying rule (`Rule 14`/`Rule 15`/etc.). This is `[ASSUMED]` — confirm this interpretation during planning/discuss, it is not confirmed anywhere in CONTEXT.md.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Accessible dropdown for vessel type | Custom `<div>` + manual keyboard handling | shadcn `Select` (Radix-based, already the project's chosen primitive per `STACK.md`) | Radix's `Select` already handles portal positioning, keyboard nav, ARIA `combobox`/`listbox` roles |
| Speed control with live numeric readout | Custom drag-slider math | shadcn `Slider` (`value`/`onValueChange` as a 1-element array) | Radix's `Slider` already handles pointer-capture drag, keyboard arrow-key stepping, min/max/step clamping |
| Range/bearing/CPA/TCPA math for instrument readouts | New trig functions in the sandbox folder | Existing `relativeBearing()` (`src/domain/geometry/relative-bearing.ts`) + `cpa()` (`src/domain/geometry/cpa.ts`) | These are the exact same, already-tested functions `classifyEncounter()` itself calls — reusing them guarantees the UI's displayed numbers always agree with the verdict shown, and adds zero new domain surface |

**Key insight:** Every "new" derived value this phase needs (readouts, status-pill risk flag, chip verdict badges) is already produced by functions that exist and are already unit-tested in `src/domain/`. The only genuinely new code this phase writes is presentation (JSX/Tailwind), 6 new `Vessel`-literal fixtures, and 2 thin pure derivation functions that call existing domain functions — not new trigonometry, not a new rules engine.

## Common Pitfalls

> The project's `research/PITFALLS.md` already documents 7 pitfalls for this milestone (hit-testing regression, dark-toggle half-wiring, `@theme` token gaps, Radix `Select`/`Slider` test rewrites, route-to-anchor scroll, shadcn CLI overwrite risk). Pitfalls 1, 3, 4, 5 apply directly to this phase — **do not re-derive them, but do act on them.** Below are the phase-8-specific findings this research adds, from directly re-reading `ChartPanel.tsx`/`app/globals.css`/`SandboxContainer.tsx` at their *current* (not stale) state.

### Pitfall S1: `PITFALLS.md`'s hex-literal list is partially stale — the file has already been half re-themed

**What goes wrong:** `PITFALLS.md`'s "UX Pitfalls" table cites `GRID_STROKE = "#E2E8F0"`, `CONE_DEFAULT_STROKE = "#CBD5E1"`, and `bg-white border-slate-200` on the `<svg>` as still-light-theme values needing conversion. **Direct read of the current `ChartPanel.tsx` (2026-07-18) shows these three are already updated**: `GRID_STROKE = "#27272A"` (with an inline comment: "border token -- dark-theme grid line (was slate-200...)"), `CONE_DEFAULT_STROKE = "#3F3F46"` (comment: "dark-theme reference cone (was slate-300...)"), and the `<svg>` already carries `className="bg-[#0B0B0E] border border-border rounded"`. If the planner blindly re-applies `PITFALLS.md`'s literal old values as a "done-checklist," it will find nothing to fix and falsely conclude re-theming is complete.

**What still genuinely needs re-theming (verified against the file's current content, line numbers from the 2026-07-18 read):**
| Constant/literal | Current value | Status |
|---|---|---|
| `GRID_STROKE` | `#27272A` | Already re-themed (has a "was slate-200" comment) |
| `CONE_DEFAULT_STROKE` | `#3F3F46` | Already re-themed (has a "was slate-300" comment) |
| `<svg>` background | `bg-[#0B0B0E] border border-border rounded` | Background already dark, but is a **raw arbitrary hex value** (`bg-[#0B0B0E]`) mixed with a semantic token (`border-border`) — inconsistent; should become a semantic token (e.g. a dedicated `--color-chart-surface` or reuse `bg-card`/`bg-popover`) for consistency with Pitfall 3/4 in `PITFALLS.md` |
| `BEARING_LINE_DEFAULT_STROKE` | `#475569` (slate-600) | **No re-theme comment — not yet addressed.** Verify contrast against `#0B0B0E`; likely needs lightening |
| `DOUBT_STROKE` | `#F59E0B` (amber-500) | No comment either way; amber-on-dark generally reads fine, but verify contrast explicitly rather than assuming |
| Rotate-handle stalk `<line>` stroke | `#94A3B8` (slate-400, inline on the JSX element, not a named constant) | **Not yet addressed** — no comment, easy to miss since it's not a top-level `const` |
| Rotate-handle circle stroke | `#0D9488` (teal-600, inline on the JSX element) | **Not yet addressed** — this is a *different* teal than the app's new `--primary`/`--accent` token (`#2dd4bf`); decide whether to align it to the token or keep it deliberately distinct |
| `HULL_FILL_CLASS` (`fill-red-500`/`fill-green-500`/`fill-slate-400`) | Tailwind default-palette utility classes, not project tokens | Not hex literals, but still not using any project-specific semantic token — see Pitfall S2 |

**How to avoid:** Grep `ChartPanel.tsx` fresh at plan/implementation time (`grep -n '#[0-9A-Fa-f]\{3,6\}' src/components/sandbox/ChartPanel.tsx`) rather than trusting `PITFALLS.md`'s example list verbatim — treat this research's table above as the current, authoritative one.

**Warning signs:** A done-checklist that only checks for the exact strings `#E2E8F0`/`#CBD5E1` will report false-clean.

**Phase to address:** Sandbox (this phase)

---

### Pitfall S2: The give-way/stand-on/mutual semantic `@theme` tokens do NOT exist yet — `08-CONTEXT.md`'s "Established Patterns" claim is incorrect

**What goes wrong:** `08-CONTEXT.md`'s "Established Patterns" section states: *"Semantic domain color tokens (give-way/stand-on/mutual) already registered under Tailwind v4 `@theme` in Phase 6 — reuse for role badges, chip active-state, and status pill coloring."* **Direct read of `app/globals.css` (2026-07-18, 173 lines, both `:root` and `.dark` blocks) shows no such tokens exist** — only the standard shadcn scaffold tokens (`--background`, `--primary` `#2dd4bf`, `--destructive` (an oklch red), `--chart-1`..`--chart-5` (all grayscale, `oklch(... 0 0)` — zero chroma), `--border`, etc.). If a plan is written assuming `--color-give-way`/`--color-stand-on`/`--color-mutual` (or similar) already exist, the first attempt to use `bg-give-way`/`fill-give-way` etc. will silently fail to generate any CSS (Tailwind v4 only generates utilities for `@theme`-registered custom properties) — exactly `PITFALLS.md`'s own Pitfall 3 ("unregistered custom theme tokens"), but triggered by a planning-time false assumption rather than an implementation slip.

**How to avoid:** Add the 3 semantic tokens to `app/globals.css`'s `@theme inline` + `:root`/`.dark` blocks as part of **this phase** (not assumed pre-existing): e.g. `--color-give-way: var(--give-way)` / `--give-way: <a red, could reuse --destructive's value>`, `--color-stand-on: var(--stand-on)` / `--stand-on: <a green — none of the existing tokens are green; `--chart-1..5` are all grayscale, so this needs a genuinely new hex/oklch value, not a reuse>`, `--color-mutual: var(--mutual)` / `--mutual: <a neutral gray, could reuse --muted-foreground>`. Use these new tokens (not raw Tailwind `red-500`/`green-500`/`slate-400`) when consolidating `HULL_FILL_CLASS`/`ROLE_BADGE`/`ROLE_BADGE_TEXT`/`VESSEL_LABEL_TEXT` into `vessel-role.ts` per `ARCHITECTURE.md` Pattern 3.

**Warning signs:** `bg-give-way`/`fill-stand-on` classes render as unstyled/transparent; devtools shows the class applied but no matching CSS rule generated.

**Phase to address:** Sandbox (this phase) — this was expected to be a Phase 6 (Scaffolding) deliverable per CONTEXT.md but is not actually present; either treat it as a small Phase 8 addition (recommended, low cost) or flag to the user as a Phase 6 gap requiring a quick-task before continuing.

---

### Pitfall S3: `SandboxContainer.tsx`'s current header (`<h1>COLREGS Navigator</h1>` + Save/Reset buttons) is superseded by the design's own Sandbox section header — but the Save/Share (`CopyLinkButton`) flow's new home is not shown anywhere in the design mock

**What goes wrong:** The current `SandboxContainer.tsx` renders its own top-level `<header>` with an `<h1>COLREGS Navigator</h1>` and both a "Save" button (calls `createScenario.mutate`) and a "Reset Scenario" button. The design mock's Sandbox section instead has its own eyebrow ("Interactive sandbox · night-display mode"), headline ("Drag a vessel — watch the verdict update"), subhead, and **only** a "Reset scenario" button in the header row — confirmed via direct image inspection, no "Save"/share button is visible anywhere in the captured Sandbox section of the design. The site-level `<h1>`/page title is presumably now owned by the global `Header`/`Hero` components built in Scaffolding/Hero phases, not `SandboxContainer` itself.

**How to avoid:** This phase's restyle must (a) remove/relocate the `<h1>COLREGS Navigator</h1>` (now redundant with the global Header, per Scaffolding phase), and (b) make an explicit decision about where the "Save"/`CopyLinkButton` CTA goes, since SCEN-01's existing save/share functionality is validated v1.0 behavior that "zero regression to underlying domain wiring or interaction model" (this phase's own goal statement) implies must be preserved, not silently dropped because it doesn't appear in the static mock. **Flagged as an Open Question below** — do not assume Save is out of scope just because it's absent from the screenshot.

**Phase to address:** Sandbox (this phase) — decide during planning/discuss, not silently drop.

## Code Examples

### shadcn `Select` — controlled value pattern (verified via Context7 `/shadcn-ui/ui`)

```tsx
// Source: Context7 /shadcn-ui/ui — apps/v4/content/docs/components/radix/select.mdx
// + apps/v4/content/docs/forms/react-hook-form.mdx (controlled pattern)
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

<Select value={vessel.type} onValueChange={(type) => onVesselTypeChange(label, type as VesselType)}>
  <SelectTrigger id={`${label}-type`} className="w-full">
    <SelectValue placeholder="Vessel type" />
  </SelectTrigger>
  <SelectContent>
    {VesselTypeSchema.options.map((type) => (
      <SelectItem key={type} value={type}>{VESSEL_TYPE_LABELS[type]}</SelectItem>
    ))}
  </SelectContent>
</Select>
```
`Select`'s `value`/`onValueChange` is the controlled pattern (matches the existing `ControlPanel` prop contract exactly — no shape change needed to `onVesselTypeChange`). [VERIFIED: Context7 /shadcn-ui/ui, HIGH]

### shadcn `Slider` — controlled array-value pattern (verified via Context7 `/shadcn-ui/ui`)

```tsx
// Source: Context7 /shadcn-ui/ui — apps/v4/registry/bases/radix/ui/slider.tsx
// + apps/v4/content/docs/components/radix/slider.mdx
import { Slider } from "@/components/ui/slider";

<Slider
  value={[vessel.speed]}
  min={0}
  max={40}
  step={1}
  onValueChange={([speed]) => onVesselSpeedChange(label, speed)}
/>
```
Slider's value/`onValueChange` are always **arrays** (multi-thumb support), even for a single-thumb control — destructure `[speed]` on the way in and out. This is a real API shape change from the current native `<input type="number">`'s single-value `onChange`. [VERIFIED: Context7 /shadcn-ui/ui, HIGH]

### Test rewrite pattern for the `<select>` → `Select` swap (SBOX-04)

Confirmed against `research/PITFALLS.md` Pitfall 5 and cross-checked with the actual current `ControlPanel.test.tsx` (line ~132, `user.selectOptions(vesselBSelect, "fishing")` — this exact line will break):

```tsx
// OLD (native <select>, breaks after the Select swap):
await user.selectOptions(vesselBSelect, "fishing");

// NEW (Radix Select via shadcn) — click trigger, then click the portalled option:
await user.click(screen.getAllByRole("combobox")[1]);
await user.click(await screen.findByRole("option", { name: "Fishing" }));
```
`findByRole` (async) is required because `SelectContent` only mounts into its portal once opened. The existing test-file convention (`// @vitest-environment jsdom` pragma + scoped polyfills, e.g. `ChartPanel.test.tsx`'s `MockResizeObserver`) must be followed for any new pointer-capture/`scrollIntoView` shims Radix's `Select`/`Slider` need under jsdom — add them locally to `ControlPanel.test.tsx`, not to a global `vitest.setup.ts` (existing project convention, `PITFALLS.md` Pitfall 5). [CITED: research/PITFALLS.md Pitfall 5, MEDIUM-HIGH — corroborated by `github.com/radix-ui/primitives` issue #1822 and `testing-library/user-event` discussion #1087]

The existing `getAllByLabelText("Speed (kn)")`-based speed-input test will similarly need rewriting for `Slider` — Radix `Slider` is not a text input; drive it via `fireEvent`/keyboard (`ArrowRight`/`ArrowLeft` on a focused thumb) rather than `user.type`, or query the thumb via its `role="slider"` and assert `aria-valuenow`.

### Instrument-readout derivation (recommended: direct geometry calls, NOT trail-facts scanning)

```typescript
// src/components/sandbox/instrument-readouts.ts (NEW, pure, framework-free)
import { relativeBearing } from "../../domain/geometry/relative-bearing.js";
import { cpa } from "../../domain/geometry/cpa.js";
import type { Vessel } from "../../domain/vessel/vessel.js";

export interface InstrumentReadouts {
  rangeNm: number;
  bearingAtoBDegrees: number | null; // null when vessels are coincident (relativeBearing() failure)
  cpaNm: number | null;              // null when cpa() reports no-closure/invalid-input
  tcpaMinutes: number | null;
}

export function deriveInstrumentReadouts(vesselA: Vessel, vesselB: Vessel): InstrumentReadouts {
  // Range: plain Euclidean distance -- NOT produced by any domain function
  // in the success path (cpa()'s ok() result never returns current
  // distance, only DCPA-at-closest-approach; only its no-closure err()
  // branch happens to carry a `currentDistanceNm` field, which is not a
  // reliable general-purpose source).
  const rangeNm = Math.hypot(
    vesselB.position.x - vesselA.position.x,
    vesselB.position.y - vesselA.position.y,
  );

  const bearingResult = relativeBearing(vesselA, vesselB);
  const cpaResult = cpa(vesselA, vesselB);

  return {
    rangeNm,
    bearingAtoBDegrees: bearingResult.ok ? bearingResult.value : null,
    cpaNm: cpaResult.ok ? cpaResult.value.dcpaNm : null,
    tcpaMinutes: cpaResult.ok ? cpaResult.value.tcpaMinutes : null,
  };
}
```
**Why not scan `classification.trail[].facts` instead:** (1) the sticky-overtaking `Rule 13(d)` trail entry has `facts: {}` — no `relativeBearingAtoB` recorded at all on that path; (2) when `cpa()` returns a `no-closure` error, **no** trail entry ever receives `tcpaMinutes`/`dcpaNm` (Stage 1's `riskOfCollision` trail push only spreads those facts `...(cpaResult.ok ? {...} : {})`); (3) "Range" has no source in `facts` under any code path — it is never computed by `classifyEncounter()` at all. Direct geometry calls are the only approach that works uniformly across every encounter type/degenerate case. **This requires widening whichever component renders the readouts to receive `vesselA`/`vesselB` as props** (currently `ReasoningPanelProps` only has `classification`/`isDegenerate` — a real `types.ts` change, though still sandbox-local, not a domain change).

**Degenerate handling:** when `isDegenerate` is true (coincident positions, per `SandboxContainer`'s existing flag), `bearingAtoBDegrees`/`cpaNm`/`tcpaMinutes` will all be `null` from this function too (since `relativeBearing()`/`cpa()` both fail on coincident input) — render "—" placeholders, consistent with the existing "Unable to classify" messaging pattern already used elsewhere in `ReasoningPanel.tsx`.

### Status pill copy derivation (D-04)

```typescript
// src/components/sandbox/status-pill.ts (NEW, pure)
export function statusPillCopy(riskOfCollision: boolean, cpaNm: number | null): { text: string; tone: "clear" | "risk" } {
  const cpaText = cpaNm !== null ? `${cpaNm.toFixed(2)} NM` : "—";
  return riskOfCollision
    ? { text: `Risk of collision — CPA ${cpaText} on present courses`, tone: "risk" } // [ASSUMED] exact copy, ungoverned by any locked contract
    : { text: `Passing clear — CPA ${cpaText} on present courses`, tone: "clear" };   // matches the design mock's literal string exactly
}
```
The `"Passing clear — CPA X.XX NM on present courses"` string is taken verbatim from the design mock (direct image inspection). The `riskOfCollision: true` counterpart is **not shown anywhere in the mock** — the string above is an original, `[ASSUMED]` suggestion following the same tone/format, not a verified requirement; confirm/adjust during planning.

### The two genuinely new chip fixtures — full worked derivation

Both were derived by hand and then **cross-verified by reimplementing `bearing()`/`relativeBearing()`/`cpa()`'s exact formulas in a standalone Node script** (line-by-line match against `src/domain/geometry/bearing.ts`, `relative-bearing.ts`, `cpa.ts`) and running them against these literals — not merely asserted. [VERIFIED: computed via a faithful reimplementation of the project's own domain formulas, cross-checked against `src/domain/colregs/classify-encounter.ts`'s exact stage-by-stage dispatch logic] — as an extra safety net, the planner should still exercise these two literals through the real `classifyEncounter()` in a throwaway Vitest/console check before shipping, since a hand-reimplementation, however careful, is not the same as running the actual module.

#### Fixture: "Not under command" — genuine Rule 18 override, final verdict "Vessel A gives way"

```typescript
export const notUnderCommandCase = {
  vesselA: { position: { x: 1.4, y: 0 }, heading: 270, speed: 10, type: "power-driven" as const },
  vesselB: { position: { x: 0, y: 0 }, heading: 0, speed: 10, type: "not-under-command" as const },
};
```
**Derivation:** These are `classify-encounter.fixtures.ts`'s own `crossingCase` position/heading values (`{0,0}`/h0 and `{5,0}`/h270 — see `crossingResidualBasicCase`) with the two vessels' identities swapped (A↔B) and the distance scaled from 5nm to 1.4nm so DCPA lands under the 1.0nm Rule-7 threshold (a genuinely at-risk, close-quarters demo, not required but more compelling than the unscaled 5nm version, which computes `riskOfCollision: false`).

- `relativeBearing(vesselA, vesselB)` = 0 (B bears dead ahead of A's own heading-270 reference — A's stern-facing course points it directly at B)
- `relativeBearing(vesselB, vesselA)` = 90
- Stage 3 (Rule 13): `|0| > 112.5`? No. `|90| > 112.5`? No. → not overtaking.
- Stage 4 (Rule 14): needs `|rbAtoB| <= 5 AND |rbBtoA| <= 5` → `0<=5` true, `90<=5` false → not head-on.
- Stage 5 (Rule 15, residual crossing): `rbAtoB > 0`? `0 > 0` is false → **baseline (pre-Rule-18) giveWay = vesselB, standOn = vesselA.**
- Stage 6 (Rule 18): baseline give-way vessel is vesselB (`not-under-command`, priority 1), baseline stand-on is vesselA (`power-driven`, priority 4). `rule18Overrides(1, 4)` → `1 < 4` → **true → OVERRIDE.** Final: `giveWay = "vesselA"`, `standOn = "vesselB"`.
- `doubt`: `|0 - 112.5| = 112.5`, `|90 - 112.5| = 22.5` — neither `<= 5` → `doubt: false`.
- `cpa(vesselA, vesselB)`: `tcpaMinutes ≈ 4.2` (positive), `dcpaNm ≈ 0.98995` (< 1.0) → **`riskOfCollision: true`.**

**Final:** `encounterType: "crossing"`, `giveWay: "vesselA"`, `standOn: "vesselB"`, `doubt: false`, `riskOfCollision: true`. The reasoning trail will show, in order: Rule 7 (risk holds), Rule 13(a)-(b) (not overtaking), Rule 14(a)-(b) (not head-on), Rule 15 (baseline crossing residual — text doesn't name a vessel, only facts), Rule 18(a)-(c) (override — flips the verdict onto vesselA). This is the clearest possible demonstration of "the geometry alone got it backwards; Rule 18 protects the NUC vessel's special status."

#### Fixture: "Sailing has priority" — same override pattern, different type (zero new derivation beyond a type swap)

```typescript
export const sailingHasPriorityCase = {
  vesselA: { position: { x: 0, y: 0 }, heading: 0, speed: 10, type: "power-driven" as const },
  vesselB: { position: { x: 5, y: 0 }, heading: 270, speed: 10, type: "sailing" as const },
};
```
This is `classify-encounter.fixtures.ts`'s existing `crossingRule18NonOverrideCase` **exactly**, with only the vessel-type label changed (`"fishing"` → `"sailing"`) — CONTEXT.md's own claim that only 2 chips need genuinely new derivation is consistent with this: `sailing` (priority 3) is still lower-priority-number than `power-driven` (priority 4), so `rule18Overrides(4, 3)` evaluates `false` — no override needed, the geometric baseline (`giveWay: "vesselA"`) is already correct, same as the existing fixture's documented behavior. `encounterType: "crossing"`, `doubt: false`.

*(Alternative, if a genuine on-screen "flip" is preferred for narrative symmetry with the NUC chip: reuse the exact `notUnderCommandCase` position/scale above with `type: "sailing"` instead of `"not-under-command"` on vesselB — `rule18Overrides(3, 4)` is still `true` since 3 < 4, so the override still fires. Either is valid; the non-override version above requires zero new derivation and is the simpler default.)*

#### Fixture: "In doubt" — rotated 45° analog of the domain's own verified 5°-inclusive head-on-boundary case, distinct visual feel, MUTUAL outcome

```typescript
export const inDoubtCase = {
  vesselA: { position: { x: 0, y: 0 }, heading: 45, speed: 10, type: "sailing" as const },
  vesselB: { position: { x: 7.66044443118978, y: 6.427876096865393 }, heading: 225, speed: 10, type: "sailing" as const },
};
```
**Derivation:** `classify-encounter.fixtures.ts`'s `headOnBoundaryInclusiveCase` places both vessels on a due-north/south line (headings 0/180) with a bearing offset of exactly 5° (the inclusive boundary of `DOUBT_BAND_DEGREES`). Rotating the **entire configuration** by 45° (both vessels' headings, and the bearing between them) preserves every relative-bearing computation exactly (relative bearing is heading-relative, not compass-absolute) while making this fixture visually distinct on the chart — a diagonal NE-SW line instead of a vertical N-S line, avoiding an identical "look" to whatever geometry the "Head-on meeting" chip reuses (`headOnGenuineCase`, which IS the vertical N-S 0°/180° shape).

- True bearing from A to B is set to 50° (`45 + 5`, so the relative bearing comes out to exactly 5): `dx = 10·sin(50°) = 7.66044443118978`, `dy = 10·cos(50°) = 6.427876096865393` (full double precision, matching the project's own established practice for exact-boundary fixtures — verified computationally to land at exactly `5.0000000000000000` in both directions, not `5.000000000000002` or similar, so it is safely on the inclusive `<=5` side).
- `relativeBearing(vesselA, vesselB)` = 5, `relativeBearing(vesselB, vesselA)` = 5 (both within the inclusive boundary).
- Stage 4 (Rule 14): `5 <= 5 AND 5 <= 5` → **true → head-on**, `doubt: true`, `doubtBoundary: "near-head-on-boundary"`.
- Stage 6 (Rule 18): both vessels are `sailing` (priority 3 == 3, a tie) → **no override → mutual obligation** (`giveWay: null`, `standOn: null`) — trail text: "Rule 18 does not apply: both vessels share the same priority tier... mutual obligation stands."
- `cpa(vesselA, vesselB)`: `tcpaMinutes ≈ 29.89` (positive), `dcpaNm ≈ 0.8716` (< 1.0) → `riskOfCollision: true`.

**Final:** `encounterType: "head-on"`, `giveWay: null`, `standOn: null` (MUTUAL, matching CONTEXT's requirement), `doubt: true`, `doubtBoundary: "near-head-on-boundary"`. Using `sailing`/`sailing` (rather than reusing `headOnGenuineCase`'s `power-driven`/`power-driven`, or the existing `headOnNucRiatmTieCase`'s NUC/RIATM pairing) additionally exercises the Rule 18 same-tier-tie code path with a third vessel-type combination, adding variety across the 6 chips without inventing new geometry math.

**On the design's "Rule 7" badge for this chip:** see Anti-Patterns above — this is a presentation-layer choice (show "Rule 7" instead of the classifying rule when `doubt === true`), `[ASSUMED]`, not something `classifyEncounter()` itself ever emits as a *classifying*-stage `ruleId`. Confirm this interpretation before implementation.

### Remaining chips — reuse existing, already-tested domain fixture values verbatim (zero new derivation)

```typescript
// "Classic crossing" — IDENTICAL to SandboxContainer's own current default seed
// (crossingResidualBasicCase / crossingCase). Rule 15, Vessel A gives way.
export const classicCrossingCase = {
  vesselA: { position: { x: 0, y: 0 }, heading: 0, speed: 10, type: "power-driven" as const },
  vesselB: { position: { x: 5, y: 0 }, heading: 270, speed: 10, type: "power-driven" as const },
};

// "Head-on meeting" — IDENTICAL to headOnGenuineCase / headOnCase. Rule 14, MUTUAL.
export const headOnMeetingCase = {
  vesselA: { position: { x: 0, y: 0 }, heading: 0, speed: 10, type: "power-driven" as const },
  vesselB: { position: { x: 0, y: 5 }, heading: 180, speed: 10, type: "power-driven" as const },
};

// "Overtaking" — mirrored relabeling of overtakingBothDirectionsCase (A and B swapped
// so the OVERTAKING vessel is now "vesselA", matching the chip's "A gives way" outcome).
// Verified: relativeBearing(newA,newB) = -30, relativeBearing(newB,newA) = 150 -- the
// second exceeds 112.5, so aOvertakesB fires: "Vessel A is overtaking Vessel B."
export const overtakingCase = {
  vesselA: { position: { x: 0.5, y: -0.8660254 }, heading: 0, speed: 15, type: "power-driven" as const },
  vesselB: { position: { x: 0, y: 0 }, heading: 0, speed: 8, type: "power-driven" as const },
};
```
`classicCrossingCase` matches `SandboxContainer`'s already-seeded default vessels exactly — clicking "Classic crossing" when it's already the active/default state is a no-op in substance (same as clicking Reset), which is fine and expected (it's shown pre-selected/active in the design mock for exactly this reason).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The design's "Rule 7" badge on the "In doubt" chip means: show "Rule 7" instead of the classifying rule whenever `classification.doubt === true` | Anti-Patterns / "In doubt" fixture | Low — purely a presentation label choice; wrong guess just means a badge shows the wrong rule number, no functional break. Confirm during planning/discuss. |
| A2 | The `riskOfCollision: true` status-pill copy ("Risk of collision — CPA X.XX NM on present courses") | Code Examples, status pill | Low — cosmetic string only, easily changed later; no locked contract exists for this exact wording |
| A3 | The verdict banner is full-width, spanning both grid columns, per the design mock (vs. living inside the "reasoning column" only) | Architecture Patterns Pattern 1 | Low-Medium — affects a CSS grid decision; wrong guess is a straightforward layout tweak, not a logic change |
| A4 | Save/`CopyLinkButton` relocates somewhere in the restyled header (exact placement TBD) rather than being intentionally dropped from this milestone | Pitfall S3 | Medium — if wrongly assumed dropped, this silently regresses validated v1.0 SCEN-01 functionality, which the phase's own goal statement ("zero regression... to the interaction model") explicitly forbids. Must be resolved before implementation, not left ambiguous. |
| A5 | The reasoning-trail should render ALL of `classification.trail`'s real entries (variable count) with a derived GEOMETRY/rule-id/VERDICT tag scheme, not hardcode 3 steps | Architecture Patterns Pattern 3 | Medium — if the design's literal "3 steps" badge is instead treated as a hard requirement, real trail content for non-crossing encounters would need to be silently collapsed/dropped, which risks violating SBOX-03's explicit "no change to content/order" requirement |

## Open Questions

1. **Where does the Save/Share (`CopyLinkButton`) CTA live in the restyled header?**
   - What we know: it exists today (`createScenario.mutate` + redirect to `/s/{shareId}`), is validated v1.0 (SCEN-01) functionality, and the design mock's captured Sandbox header only shows a "Reset scenario" button.
   - What's unclear: whether it's just scrolled out of the captured screenshot region, intentionally deferred to a secondary/icon-only affordance, or genuinely not part of this redesign's visual language.
   - Recommendation: confirm with the user/design source before implementation — do not silently drop it. If truly absent from the design, it likely still needs *some* accessible home (e.g. a small icon button near "Reset scenario", or inside a vessel-control card's overflow menu) to avoid a functional regression.

2. **Is the "Rule 7" badge on the "In doubt" chip a literal per-scenario override, or does the design intend it more generally (e.g. shown whenever `doubt: true`, on ANY chip that happens to land in a doubt band)?**
   - What we know: only the "In doubt" chip is explicitly labeled this way among the 6; the existing domain doubt logic (`doubtBoundary`) already fires for both the head-on and overtaking/crossing boundaries elsewhere in the app (e.g. dragging a vessel near either boundary manually, independent of any chip).
   - What's unclear: should ANY manually-dragged-into-doubt state also show a "Rule 7" verdict badge (replacing whatever rule badge would otherwise show), or is this literally hardcoded/special-cased to the "In doubt" chip's specific fixture only?
   - Recommendation: derive it generically from `classification.doubt` (not chip-specific) — this is simpler, more consistent, and automatically covers the manual-drag case too, matching the spirit of Rule 7(a)'s "when in doubt" doctrine applying regardless of how the doubt state was reached.

3. **Does clicking a chip need to visually track "which chip is active" after a subsequent manual drag/form edit diverges from that chip's canonical values?**
   - What we know: D-01/D-02 only specify the load mechanics (full replace + hysteresis reset), not ongoing "active chip" tracking.
   - What's unclear: the design shows "Classic crossing" chip visually active/teal-filled in its captured (default) state — implying SOME active-state styling exists — but doesn't show what happens to that highlight after a manual drag.
   - Recommendation: track `activeChipId` state, clear it (deselect all chips) on any manual drag/heading/speed/type change that doesn't originate from a chip click — cheap to implement, avoids a stale/misleading highlight, no domain risk either way.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `radix-ui` npm package | Select/Slider primitives | ✓ (already installed per `package.json`) | 1.6.2 | — |
| `shadcn` CLI | `npx shadcn add select slider` | ✓ | 4.13.1 | — |
| `src/components/ui/select.tsx` | SBOX-02 | ✗ (not yet generated — only `badge.tsx`/`button.tsx`/`card.tsx` exist) | — | Run `npx shadcn@latest add select` before implementation (Wave 0 prerequisite) |
| `src/components/ui/slider.tsx` | SBOX-02 | ✗ | — | Run `npx shadcn@latest add slider` before implementation (Wave 0 prerequisite) |
| `--color-give-way`/`--color-stand-on`/`--color-mutual` tokens in `app/globals.css` | Role badge/chip/pill coloring | ✗ (confirmed absent, contra CONTEXT.md's assumption — see Pitfall S2) | — | Add as part of this phase (small, low-risk `@theme` addition) |
| Node/npm/vitest | Test execution | ✓ | node v22.23.1, npm 10.9.8, vitest 4.1.10 | — |

**Missing dependencies with no fallback:** none — all gaps above have a straightforward, low-risk fix (run `shadcn add`, add 3 CSS custom properties) that should simply be a Wave 0 task in the plan, not a blocker.

## Security Domain

`security_enforcement` is not set in `.planning/config.json` (absent = enabled per policy), but this phase introduces no new trust boundary, no new user input reaching a server, and no new authentication/authorization surface — it is a presentation-layer restyle plus client-only preset data (never sent to a server) feeding the same, unchanged `VesselSchema.safeParse()` validation gate that already exists in `SandboxContainer.applyVesselUpdate()`.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | No auth surface in this phase |
| V3 Session Management | No | N/A |
| V4 Access Control | No | N/A |
| V5 Input Validation | Yes (unchanged) | `VesselSchema.safeParse()` (existing, in `SandboxContainer.applyVesselUpdate`) already validates every vessel update, including chip-click-driven updates, since chips route through the same function per D-01/D-02 |
| V6 Cryptography | No | N/A |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Malformed chip fixture data bypassing validation | Tampering | Not applicable — chip literals are hardcoded, developer-authored constants, not user input; still pass through `VesselSchema.safeParse()` via `applyVesselUpdate()` like every other update path, so even a typo'd literal (e.g. `heading: 400`) is caught by the existing schema (`heading` must be `>= 0 && < 360`) rather than silently corrupting state |

## Sources

### Primary (HIGH confidence)
- Context7 `/shadcn-ui/ui` — `Select`/`Slider` controlled-value API, current source of `slider.tsx`, `select.mdx`
- Direct repository reads (2026-07-18): `SandboxContainer.tsx`, `ControlPanel.tsx`, `ControlPanel.test.tsx`, `ReasoningPanel.tsx`, `ChartPanel.tsx`, `vessel-role.ts`, `types.ts`, `useHullDrag.ts`, `useRotateHandleDrag.ts`, `classify-encounter.ts`, `classify-encounter.fixtures.ts`, `types.ts` (domain), `vessel.ts`, `risk-of-collision.ts`, `relative-bearing.ts`, `relative-bearing.fixtures.ts`, `cpa.ts`, `cpa.fixtures.ts`, `bearing.ts`, `vessel-priority.ts`, `app/globals.css`, `components.json`, `package.json`, `vitest.config.ts`
- `.planning/design/Main-Design.png` — direct image inspection (cropped into bands via Python/PIL) of the Sandbox section: eyebrow/headline/subhead copy, chip row + order/labels, verdict-banner card layout, instrument-readout grid + status pill exact copy, numbered reasoning-trail styling, vessel-control cards (Type Select, Speed Slider + live readout, read-only Heading), "1 NM" scale-bar legend
- Node.js reimplementation of `bearing()`/`relativeBearing()`/`cpa()` formulas, executed directly to verify all 3 newly-derived fixtures' bearing/doubt/risk/override outcomes

### Secondary (MEDIUM confidence)
- `.planning/research/ARCHITECTURE.md`, `STACK.md`, `PITFALLS.md` (2026-07-18, this milestone's own prior research) — cited and extended, not duplicated; Pitfall S1 above specifically corrects/updates `PITFALLS.md`'s hex-literal list against the file's actual current state

### Tertiary (LOW confidence)
- None — every claim above is either directly verified against repository files, Context7, or the design image, or explicitly tagged `[ASSUMED]` in the Assumptions Log

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages, `Select`/`Slider` API confirmed via Context7 against the project's exact locked `--base radix` choice
- Architecture (layout grid, chip data module, instrument-readout derivation): HIGH — grounded in direct design-image inspection and direct source reads, not assumption
- New fixture geometry (`not-under-command`, `in doubt`): HIGH — hand-derived AND cross-verified via a faithful Node reimplementation of the actual domain formulas; recommend one final sanity pass against the real `classifyEncounter()` at implementation time
- Pitfalls: HIGH for S1/S2 (both are direct-repository-read corrections of stale/incorrect prior claims) — MEDIUM for the "Rule 7 badge" interpretation (A1, presentation-layer guess)

**Research date:** 2026-07-18
**Valid until:** 30 days (stable, mid-milestone; re-verify if `PITFALLS.md`/`ARCHITECTURE.md` are revised, or if Phase 6/Scaffolding's token gap (Pitfall S2) is fixed independently before this phase starts)
