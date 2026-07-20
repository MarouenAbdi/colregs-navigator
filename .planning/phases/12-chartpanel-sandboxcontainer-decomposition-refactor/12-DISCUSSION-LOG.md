# Phase 12: ChartPanel/SandboxContainer Decomposition Refactor - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-20
**Phase:** 12-ChartPanel/SandboxContainer Decomposition Refactor
**Areas discussed:** Opportunistic rangeNm dedup, New unit tests for extracted modules, Plan/PR granularity

---

## Opportunistic rangeNm dedup

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, dedup now | Have `deriveChartOverlayState()` call `deriveInstrumentReadouts(vesselA, vesselB).rangeNm` instead of recomputing. Free since the code is already being touched. | ✓ |
| No, defer to a separate cleanup | Keep this phase strictly to the RFCT-01–08 checklist. | |

**User's choice:** Yes, dedup now (recommended option).
**Notes:** None.

---

## New unit tests for extracted modules

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, add dedicated tests | `chart-panel-geometry.test.ts` + `chart-panel-derivation.test.ts`, matching the hero-preview-geometry.ts/static-chart-geometry.ts precedent. | ✓ |
| Geometry only, skip derivation tests | Add geometry tests only; rely on ChartPanel.test.tsx's indirect coverage of derivation. | |
| No new test files | Rely entirely on the existing suite passing unmodified. | |

**User's choice:** Yes, add dedicated tests (recommended option).
**Notes:** None.

---

## Plan/PR granularity

| Option | Description | Selected |
|--------|-------------|----------|
| One PR, VesselGroup as its own commit | Stay within the one-phase-one-PR convention; VesselGroup.tsx's move lands as its own final, separately-reviewable commit/plan. | ✓ |
| One PR, all extractions as one commit | Land the whole decomposition as a single commit/plan. | |

**User's choice:** One PR, VesselGroup as its own commit (recommended option).
**Notes:** Confirmed via `git branch -a` that every phase since Phase 4 follows one-branch/one-PR; already on `gsd/phase-12-chartpanel-sandboxcontainer-decomposition-refactor`.

---

## Claude's Discretion

- **VesselGroup verification depth** — not selected as a discussion area by the user. Defaulted
  to ARCHITECTURE.md's own recommendation (optional DOM-order assertion + human real-browser pass
  only, no automated Claude-in-Chrome pre-check, mirroring Phase 11's D-05 precedent).
- Exact plan/wave boundaries within the extraction-order table (steps 1–4b have no ordering
  dependency on each other) — left to the planner.

## Deferred Ideas

None raised during this discussion. `ChipRow.tsx` extraction and the `SandboxContainer`
header-block split were already deferred to v2 (RFCT-V2-01) in REQUIREMENTS.md prior to this
session — not new scope creep surfaced here.
