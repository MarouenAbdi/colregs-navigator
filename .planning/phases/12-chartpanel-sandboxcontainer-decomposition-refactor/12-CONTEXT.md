# Phase 12: ChartPanel/SandboxContainer Decomposition Refactor - Context

**Gathered:** 2026-07-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Decompose `ChartPanel.tsx` (574 lines) and `SandboxContainer.tsx` (301 lines) into focused,
single-concern modules following this project's established "split computation from
presentation" convention, with zero behavior change and zero hit-testing regression.

The full target decomposition, exact function signatures, and risk-ordered extraction
sequence are already locked by prior research (`.planning/research/ARCHITECTURE.md`) — this
discussion did not re-litigate that shape. It covered only the implementation judgment calls
research explicitly left open: an opportunistic dedup, whether to add new test files for the
new pure modules, and how the phase should be split into commits/PRs.

No new capabilities. `classifyEncounter()` and all COLREGS rule outputs stay untouched — this
phase touches only the internal structure of two presentation-layer components.

</domain>

<decisions>
## Implementation Decisions

### Opportunistic rangeNm dedup

- **D-01:** Do the dedup in this pass. `chart-panel-derivation.ts`'s `deriveChartOverlayState()`
  calls `deriveInstrumentReadouts(vesselA, vesselB).rangeNm` instead of recomputing the identical
  `Math.hypot(...)` formula inline. This is the same duplication class `vessel-role.ts`'s own
  comment already flags as a past bug source in this codebase, the code is already being touched
  in Extraction 2, and the change is zero-risk (same formula, same value). Not required by any
  RFCT-xx requirement, but free given the code is already moving.

### New unit tests for extracted modules

- **D-02:** Add dedicated new test files for both new pure modules, matching the precedent set
  by `hero-preview-geometry.ts`/`static-chart-geometry.ts`:
  - `chart-panel-geometry.test.ts` — numeric-fixture unit tests for `wedgePath()` and
    `buildGridLineSegments()`.
  - `chart-panel-derivation.test.ts` — tests for `deriveChartOverlayState()`, reusing the same 3
    fixtures already imported by `ChartPanel.test.tsx` (`crossingResidualBasicCase`,
    `headOnBoundaryInclusiveCase`, `doubtBandNearOvertakingBoundaryCase`).
  This goes beyond RFCT-08's literal requirement (existing suite passes unmodified) but matches
  this project's stated testing priority for pure, framework-free modules and the bar both prior
  successful split-convention applications already cleared.

### Plan / PR granularity

- **D-03:** Stay within this project's established one-phase-one-PR convention (confirmed via
  `git branch -a`: every phase since Phase 4 is one branch → one PR, already on
  `gsd/phase-12-chartpanel-sandboxcontainer-decomposition-refactor`). Within that single PR,
  extractions 1–4b (geometry, derivation, `useSandboxState`, `useContainerSize`, `ChartBackdrop`)
  land as one or more earlier commits/plans; `VesselGroup.tsx`'s verbatim move — the step
  containing both documented hit-testing regression classes (Phase 4, Phase 8) — lands as its
  own final, separately-reviewable commit/plan, per ARCHITECTURE.md's suggestion. Do not split
  VesselGroup's move into a second PR/branch.

### Claude's Discretion

- **VesselGroup verification depth** — not discussed (user did not select this area). Default to
  ARCHITECTURE.md's own recommendation: add the optional DOM-order regression assertion (rotating
  `<g transform="rotate(...)">` precedes the non-rotating `<g pointerEvents="none">` sibling) as
  belt-and-suspenders, then go straight to a human real-browser drag/rotate pass for RFCT-06 — no
  Claude-in-Chrome automated pre-check, mirroring Phase 11's D-05 precedent (TWFX-04) of skipping
  an automated pre-check in favor of the human pass directly.
- Exact plan/wave boundaries beyond the VesselGroup-last requirement (D-03) — left to the planner,
  following ARCHITECTURE.md's extraction-order table (steps 1–4b have no ordering dependency on
  each other).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & roadmap
- `.planning/REQUIREMENTS.md` (RFCT-01 through RFCT-08, lines ~30–37, ~86–93) — the locked
  requirement text this phase must satisfy, including the explicit Out-of-Scope entry for
  `ChipRow.tsx` extraction / header-block split (RFCT-V2-01, deferred to v2 — do not do this).
- `.planning/ROADMAP.md` (Phase 12 section, lines 94–107) — success criteria, depends-on
  (Phase 11), canonical target file list.

### Architecture research — the primary source for this phase
- `.planning/research/ARCHITECTURE.md` — full target decomposition, exact function signatures
  for every new module/hook (`chart-panel-geometry.ts`, `chart-panel-derivation.ts`,
  `ChartBackdrop.tsx`, `hooks/useContainerSize.ts`, `VesselGroup.tsx`,
  `hooks/useSandboxState.ts`), the risk-ordered extraction table (steps 0–5), the opportunistic
  `rangeNm` dedup finding (now locked in as D-01), and 4 named anti-patterns to avoid during the
  refactor (padded invisible hit-shapes, losing `pointerEvents="none"`, geometry module returning
  JSX, re-extracting already-extracted hit-testing hooks). **Read this file in full before
  planning — it supersedes generic decomposition guidance.**

### Prior hit-testing regression precedent (critical — read before touching VesselGroup)
- `.planning/PROJECT.md` → Key Decisions table — both documented SVG hit-testing regressions:
  "SVG drag/rotate hit-targets must hit-test the actual visible shape, not a padded invisible
  proxy" (Phase 4, commits `3bf6f24`, `f559e98`) and "Decorative overlays layered on top of an
  interactive shape need explicit `pointer-events: none`" (Phase 8, commit `fb0ec8a`). Both live
  entirely inside the JSX that becomes `VesselGroup.tsx`.
- `src/components/sandbox/ChartPanel.test.tsx` — contains the existing regression test for the
  `pointerEvents="none"` badge overlay; this is the gate `VesselGroup.tsx`'s extraction must pass
  unmodified.

### Existing split-convention precedent (structural template)
- `src/components/hero/hero-preview-geometry.ts` — pure, zero-JSX module; template for
  `chart-panel-geometry.ts`.
- `src/components/shared/static-chart-geometry.ts` — pure module extracted once a second real
  consumer existed; same "zero React import" bar the new geometry module must clear.
- `src/components/sandbox/instrument-readouts.ts` (`deriveInstrumentReadouts()`) — the module
  `chart-panel-derivation.ts`'s `deriveChartOverlayState()` reuses for `rangeNm` per D-01, and the
  existing sibling pattern for a per-render pure-derivation module in this same folder.
- CLAUDE.md § Conventions ("Separation of concerns: split computation from presentation") — the
  general convention this phase applies to its two outlier files.

</canonical_refs>

<code_context>
## Existing Code Insights

### Current file sizes (confirmed 2026-07-20)
- `src/components/sandbox/ChartPanel.tsx` — 574 lines (grew slightly since ARCHITECTURE.md's
  560-line snapshot from Tailwind-fix-related edits in Phase 11).
- `src/components/sandbox/SandboxContainer.tsx` — 301 lines (similarly grew from 280).

### Already-extracted precedent inside `src/components/sandbox/`
- `hooks/useHullDrag.ts` / `hooks/useRotateHandleDrag.ts` — already hold 100% of the actual
  pointer-capture/hit-testing logic, each with its own dedicated test file. **Do not re-extract
  or modify these** — this phase only moves the JSX that consumes their `DragHandlers` output.
- `chip-scenarios.ts` — already correctly extracted (data only); the state machine around it
  (`useSandboxState`) is what's being extracted this phase, not the data itself.
- `instrument-readouts.ts` — existing per-render pure-derivation module; the direct structural
  analog for the new `chart-panel-derivation.ts`.

### Reusable test fixtures
- `ChartPanel.test.tsx` already imports 3 named fixtures (`crossingResidualBasicCase`,
  `headOnBoundaryInclusiveCase`, `doubtBandNearOvertakingBoundaryCase`) usable directly by the
  new `chart-panel-derivation.test.ts` per D-02.

</code_context>

<specifics>
## Specific Ideas

No additional specific requirements beyond ARCHITECTURE.md's locked decomposition and the three
decisions above (D-01–D-03). User confirmed the research-recommended path on all three areas
raised.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. (`ChipRow.tsx` extraction and the
`SandboxContainer` header-block split were already explicitly deferred to v2 as RFCT-V2-01 in
REQUIREMENTS.md before this discussion started, not raised as new scope creep here.)

</deferred>

---

*Phase: 12-ChartPanel/SandboxContainer Decomposition Refactor*
*Context gathered: 2026-07-20*
