# Phase 18: On-Chart Vessel Control Overlay - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-25
**Phase:** 18-On-Chart Vessel Control Overlay
**Areas discussed:** Overlay close behavior, Risk badge tiers, Footer required-action copy, Overlay open trigger

Before discussion, the actual current design file (`COLREGS Navigator (shadcn).dc.html`) was fetched live from the `claude.ai/design` project referenced in `PROJECT.md`, via the `DesignSync` tool. This surfaced two concrete conflicts between the design source's coded behavior and this project's own prior locked decisions (ROADMAP wording and `status-pill.ts`'s documented rationale), which were put to the user directly rather than resolved silently.

---

## Overlay close behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Add the toggle (per ROADMAP) | Keep the design's × button and click-empty-chart-closes behavior, and additionally make re-clicking the already-open vessel close its overlay — satisfies the locked ROADMAP criterion exactly. | ✓ |
| Follow the design file only | Skip the re-click toggle; rely solely on the × button and clicking empty chart space to close, matching the design's actual behavior exactly. Would mean asking to amend the ROADMAP criterion. | |

**User's choice:** Add the toggle (per ROADMAP).
**Notes:** All three closing paths (re-click same vessel, × button, click empty chart) now coexist. Captured as D-01.

---

## Risk badge tiers

| Option | Description | Selected |
|--------|-------------|----------|
| Keep existing 3-tone (clear/risk/opening) | Move the current domain-driven `statusPillCopy()` logic into the header strip's risk-pill slot unchanged, just restyled. No new non-domain-backed tier. | |
| Adopt the design's 4-tier scheme | Add a new 'watch'/close-quarters-developing amber tier driven by a CPA-distance heuristic, matching the design file's visual richness exactly, even though it isn't backed by `classifyEncounter()`'s `riskOfCollision` signal. | ✓ |

**User's choice:** Adopt the design's 4-tier scheme.
**Notes:** User was shown the direct conflict with `status-pill.ts`'s existing code comment (which explicitly rejected CPA-distance heuristics as "prototype-only... could contradict the actual verdict") before choosing. Captured as D-02, with the divergence scoped explicitly to this one UI element — no change to `classification.riskOfCollision` or the give-way/stand-on verdict.

---

## Footer required-action copy

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, use the design's exact copy | Adopt the three strings verbatim from the design file — matches the milestone's "match the design exactly" intent. | ✓ |
| No, I'll give different wording | Use different per-role action copy — specify what it should say instead. | |

**User's choice:** Yes, use the design's exact copy.
**Notes:** Captured as D-03. Exact strings recorded in `18-DESIGN-SNAPSHOT.md`.

---

## Overlay open trigger

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, open on pointerdown (matches design) | Overlay opens immediately when the vessel is pressed, even if a drag follows right after — lowest technical risk, reuses the existing drag pointerdown handler, matches the design file's actual coded behavior. | ✓ |
| No, only open on a clean click | Overlay should only open if the pointer is released without meaningfully moving (a real click, not a drag-start) — requires new movement-threshold detection logic not present in the design file. | |

**User's choice:** Yes, open on pointerdown (matches design).
**Notes:** Chosen specifically to avoid new click-vs-drag hit-testing logic, given this codebase's documented twice-fixed regression history in this exact area. Captured as D-04.

---

## Claude's Discretion

- Exact Tailwind/shadcn translation of the design source's inline-style overlay card positioning/blur/shadow — port the behavior, not the raw CSS literals.
- Whether risk-badge `riskText` copy is reused verbatim or lightly adapted to this app's existing phrasing conventions.
- Whether to include the design's decorative corner bezel accents on the chart frame this phase or defer them (not in ROADMAP's success criteria).

## Deferred Ideas

None — discussion stayed within phase scope.
