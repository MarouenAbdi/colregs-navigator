# Phase 19: Guided Tour - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-26
**Phase:** 19-Guided Tour
**Areas discussed:** Dialog implementation, Final-step button label, Tour illustrations, Z-index handling

---

## Dialog implementation

| Option | Description | Selected |
|--------|-------------|----------|
| shadcn/Radix Dialog | Add `npx shadcn add dialog` (zero new dependency). Gets Escape-to-close, outside-click-to-close, and focus-trap/focus-return for free — directly closes the gap where the design source's own tour code has no Escape/outside-click handling. | ✓ |
| Hand-rolled bespoke modal | Recreate the design's exact fixed-overlay div by hand and manually add Escape/outside-click/focus-trap logic. Matches the design's literal markup most closely but duplicates behavior Radix already provides, more regression risk. | |

**User's choice:** shadcn/Radix Dialog (recommended option).
**Notes:** Discovered while fetching the live design source that its own tour prototype has no Escape handler and no outside-click handler on the overlay div — a real gap vs. ROADMAP's locked criteria 3/4, same category as Phase 18's D-01.

---

## Final-step button label

| Option | Description | Selected |
|--------|-------------|----------|
| "Start exploring" (verbatim design copy) | Matches the actual design source's copy exactly; behavior (closes tour) is identical either way. | ✓ |
| "Done" | Matches ROADMAP's literal descriptive wording, diverges from the design source's actual copy. | |

**User's choice:** "Start exploring" (verbatim design copy).
**Notes:** ROADMAP describes the behavior as '"Done" replaces "Next"' but the design source's actual coded button text on the final step is "Start exploring" — same forward button, same close-on-last-step behavior, different label text.

---

## Tour illustrations

| Option | Description | Selected |
|--------|-------------|----------|
| Port verbatim | Reuse the design's exact 6 inline-SVG illustrations as-is inside a new `TourStepIllustration.tsx`, switched by step id. | ✓ |
| Simplify / re-create | Design lighter-weight or restyled illustrations instead of porting the raw SVG markup verbatim. | |

**User's choice:** Port verbatim (recommended option).
**Notes:** All 6 illustrations were already extracted from the design source during this discussion — see `19-DESIGN-SNAPSHOT.md` for the full SVG markup.

---

## Z-index handling

| Option | Description | Selected |
|--------|-------------|----------|
| Document a shared z-index scale | Add a small documented constant/scale covering the Tour portal's tier relative to Phase 18's `VesselControlOverlay` and other overlays, so a future collision is diagnosable. | ✓ |
| One-off value for this phase only | Set an explicit z-index high enough to sit above everything else without establishing a shared/documented scale. | |

**User's choice:** Document a shared z-index scale (recommended option).
**Notes:** PITFALLS.md's Pitfall 4 explicitly flags this risk given two new stacking features (Tour + Phase 18 overlay) landing in the same milestone.

---

## Claude's Discretion

- Exact mechanism for documenting the z-index scale (shared constants module, CSS custom properties, or a documented comment convention).
- Whether `TourStepIllustration.tsx` renders via `dangerouslySetInnerHTML` or translated inline JSX.
- Exact TypeScript shape of `guided-tour-steps.ts`'s `points` field (fixed tuple vs. general array).
- Precise Tailwind/shadcn translation of the modal card's inline-style treatment (border/shadow/backdrop-blur/dimensions).

## Deferred Ideas

None new. TOUR-03 (auto-launch tour on first visit) was already deferred to v2 at v1.4 requirements scoping — not re-litigated in this discussion.
