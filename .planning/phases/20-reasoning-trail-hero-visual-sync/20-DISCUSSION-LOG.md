# Phase 20: Reasoning-Trail & Hero Visual Sync - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-27
**Phase:** 20-Reasoning-Trail & Hero Visual Sync
**Areas discussed:** Hero's "LIVE" indicator vs. static precedent, Hero layout restructuring scope, Trail animation density, Trail copy details

---

## Hero's "LIVE" indicator vs. static precedent

**Q1: Hero's footer LIVE indicator: port the design's pulsing dot, or keep it static?**

| Option | Description | Selected |
|--------|-------------|----------|
| Keep static (no pulse) | Preserves D-01's rationale exactly: Hero is illustrative/fixture-driven, a pulsing dot visually claims real-time data it doesn't have. | |
| Port the pulsing dot | Matches the design source and the real Sandbox's ChartFooterStrip exactly. Treats "visually match the updated design file" as controlling over the older, pre-revision D-01 precedent. | ✓ |
| You decide | Claude picks based on which reading fits best. | |

**User's choice:** Port the pulsing dot

**Q2: Should the Hero LIVE dot be visually identical to the real Sandbox's LIVE dot, or subtly distinguished as illustrative?**

| Option | Description | Selected |
|--------|-------------|----------|
| Identical (reuse exactly) | Same color/timing as ChartFooterStrip.tsx's LIVE dot. | |
| Subtly distinguished | Same motif but a different (slower/dimmer) pulse, so Hero doesn't visually claim to be wired to live data. | ✓ |

**User's choice:** Subtly distinguished
**Notes:** Resolves the tension by keeping the spirit of D-01 (Hero must not look wired to real vessel state) while honoring the phase's design-fidelity goal.

---

## Hero layout restructuring scope

**Q1: Full layout parity with the design, or surface-only styling on the current layout?**

| Option | Description | Selected |
|--------|-------------|----------|
| Full layout parity | Move rule chip + title + risk pill into a header strip; expand footer to 4 readouts incl. TCPA. | ✓ |
| Surface-only styling | Keep current verdict-banner-below-chart + 3-metric grid, only restyle colors/bezel. | |

**User's choice:** Full layout parity

**Q2: What happens to the current "Live classification" eyebrow line + "BRG-ring · 12 NM" label?**

| Option | Description | Selected |
|--------|-------------|----------|
| Remove it entirely | New header strip fully replaces its role; matches the design, which has no separate eyebrow row. | ✓ |
| Keep a trimmed version | Retain a minimal illustrative-labeling cue elsewhere on the card. | |

**User's choice:** Remove it entirely

---

## Trail animation density

**Q1: How much of the design's 3-layer trail animation should we port?**

| Option | Description | Selected |
|--------|-------------|----------|
| All three (full fidelity) | Dashed flow + traveling pulse + per-token sweep. Most visually rich. | ✓ |
| Connector only | Satisfies criterion 2 with least visual noise. | |
| Connector + traveling pulse | Middle ground, skips per-token spinners. | |

**User's choice:** All three (full fidelity)

**Q2: Should the trail's (and Hero's) new animations honor prefers-reduced-motion?**

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, respect prefers-reduced-motion | Guard new keyframes behind `@media (prefers-reduced-motion: no-preference)`. | ✓ |
| No, match the design exactly | Design source has no such guard either. | |

**User's choice:** Yes, respect prefers-reduced-motion
**Notes:** This is an addition beyond what the design source itself does — the design has no reduced-motion handling at all.

---

## Trail copy details

**Q1: Step-count badge wording — "N steps" or "N contacts"?**

| Option | Description | Selected |
|--------|-------------|----------|
| "N contacts" (design) | Matches the radar/naval-tactical theme already in the redesign. | ✓ |
| Keep "N steps" | Clearer that these are logical reasoning steps, not literal radar contacts. | |

**User's choice:** "N contacts" (design)

**Q2: Header subtitle — add "radar acquisition", or omit?**

| Option | Description | Selected |
|--------|-------------|----------|
| Add "radar acquisition" | Matches the design verbatim: "NAV DECISION CHAIN · radar acquisition". | ✓ |
| Omit it | Keep just "NAV DECISION CHAIN". | |

**User's choice:** Add "radar acquisition"

---

## Claude's Discretion

- Exact color/opacity/timing tuning for the Hero LIVE dot's "subtly distinguished" pulse — no specific numbers requested.
- Whether the reduced-motion fallback shows a fully static state or a single non-repeating transition.

## Deferred Ideas

None — discussion stayed within phase scope.
