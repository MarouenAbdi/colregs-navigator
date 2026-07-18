# Phase 8: Sandbox - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-18
**Phase:** 8-Sandbox
**Areas discussed:** Preset scenario chips, Status pill, Responsive stack order

---

## Preset scenario chips — scope

| Option | Description | Selected |
|--------|-------------|----------|
| Visual-only, one active state | Render the chip row exactly as designed, non-functional beyond showing "Classic crossing" as active. Recommended for lowest cost, consistent with FEATURES.md's deferred stance. | |
| Fully wired, in-place load | Clicking a chip loads that canned scenario into the current SandboxContainer, no navigation. New feature; contradicts FEATURES.md's earlier deferral. | ✓ |
| Omit entirely | Skip the chip row; not in SBOX-01..05's success criteria. | |

**User's choice:** Fully wired, in-place load.
**Notes:** Deliberate scope expansion beyond the earlier FEATURES.md stance — user chose to build it now.

---

## Preset scenario chips — fixture source

| Option | Description | Selected |
|--------|-------------|----------|
| Reuse Gallery's existing scenarios | Pull the same 6 curated encounters via gallery.list(), one shared source of truth. | ✓ (initial answer) |
| New standalone fixtures | Author 6 new hardcoded vessel-pair fixtures in the sandbox folder, independent of Gallery/DB. | ✓ (final answer, after investigation) |

**User's choice:** Initially "Reuse Gallery's existing scenarios." After Claude inspected `src/server/db/curated-scenarios.ts` and `prisma/seed.ts` and found the actual 6 curated entries don't match the design's 6 chip labels (no `not-under-command` case, no distinct "in doubt" case, a stand-on-mirror duplicate the design doesn't show, no `title` field), and that this data lives under `src/server/db/` — a directory REQUIREMENTS.md locks as untouched this milestone — Claude brought this back to the user with a corrected option set. Final choice: **New standalone fixtures, sandbox-local**, mirroring Hero's Phase 7 fixture precedent.
**Notes:** This supersedes the initial answer; CONTEXT.md records only the final decision (D-03).

---

## Preset scenario chips — click behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Full replace, like Reset Scenario | Vessel A/B fully overwritten with the chip's canned values; hysteresis cleared; identical mechanics to handleReset(). | ✓ |
| You decide | Claude picks mechanics during planning. | |

**User's choice:** Full replace, like Reset Scenario.
**Notes:** None.

---

## Status pill (instrument readouts)

| Option | Description | Selected |
|--------|-------------|----------|
| Build — derive from riskOfCollision | Show "Passing clear — CPA X.XX NM..." when false, a distinct risk-flagged message when true. | ✓ |
| Build — always show CPA, no risk framing | Always render CPA text regardless of risk state, no passing-clear/risk distinction. | |
| Skip this pill | Not in SBOX-01..05's explicit criteria; omit. | |

**User's choice:** Build — derive from riskOfCollision.
**Notes:** Exact wording for the risk-true case left to Claude's discretion (not shown in the design mock).

---

## Responsive stack order (below 900px)

| Option | Description | Selected |
|--------|-------------|----------|
| Chart → Reasoning → Controls | Matches current desktop visual priority top-to-bottom. | ✓ |
| Chart → Controls → Reasoning | Puts input controls immediately below the chart. | |
| You decide | Claude picks based on what reads best once components exist. | |

**User's choice:** Chart → Reasoning → Controls.
**Notes:** No mobile mock exists for this section; this order was chosen by visual-priority analogy to the desktop layout.

---

## Claude's Discretion

- Exact geometry/vessel values for the new `not-under-command` and near-doubt-boundary chip fixtures
- Exact wording of the status pill's risk-flagged (riskOfCollision: true) message
- Exact mechanism for deriving instrument-readout values (facts-trail scan vs. direct geometry-function call)
- Component boundary/structure for splitting ReasoningPanel into verdict-banner / instrument-readouts / reasoning-trail cards
- Exact shadcn primitives composed for the chip row and form controls
- Test coverage shape for the new chip-click interaction

## Deferred Ideas

- Fixing the curated-scenario seed data itself (title field, missing fixtures) so the actual Gallery cards Phase 9 builds match the design's 6 labels — surfaced during this discussion but deferred to Phase 9 (touches `src/server/`, out of this milestone's locked boundary for Phase 8)
- "Embed gallery on home page instead of separate route" todo — reviewed via todo cross-reference, confirmed as Phase 9's concern, not folded into Phase 8
