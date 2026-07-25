# Requirements: COLREGS Navigator — v1.4 Design Sync (Sandbox & Gallery)

**Defined:** 2026-07-25
**Core Value:** Given any two-vessel encounter, correctly classify it under COLREGS and clearly explain — not just assert — which vessel must give way and why.

## v1 Requirements

Requirements for this milestone. Each maps to roadmap phases. Zero change to `classifyEncounter()` or any domain/`src/server/` logic — presentation layer only, same pattern as v1.1.

### Sandbox

- [ ] **SBOX-06**: Chart header strip merges the rule badge, encounter title, and risk badge into one command strip atop the chart (replaces the separate `VerdictBanner` card)
- [ ] **SBOX-07**: Chart footer strip merges the LIVE/RANGE/BEARING/CPA/TCPA readouts and each vessel's required-action text into one strip below the chart (replaces the separate `InstrumentReadouts` card)
- [ ] **SBOX-08**: User can click a vessel on the chart to open an on-chart floating control card (type, speed, heading) for that vessel, replacing the always-visible side `ControlPanel`
- [ ] **SBOX-09**: Reasoning trail renders as a horizontal sequence of connected step cards ("NAV DECISION CHAIN"), replacing the vertical list
- [x] **SBOX-10**: The inline 6-chip preset row is removed from the Sandbox; scenario loading happens only via the Gallery's "Try on Sandbox" action

### Guided Tour

- [ ] **TOUR-01**: User can open a 6-step guided tour via a "How to read this" button, with Back/Next/Skip controls, a per-step illustration, and step-dot progress
- [ ] **TOUR-02**: Tour dismisses via Escape, clicking outside, or Skip/Done, and returns keyboard focus to the trigger button

### Gallery

- [ ] **GAL-05**: User can click "Try on Sandbox" on a gallery card to load that scenario directly into the homepage Sandbox's live state and be smooth-scrolled to it, with no page navigation (replaces the whole-card `Link` to `/s/{id}`)
- [ ] **GAL-06**: The "Try on Sandbox" CTA is reachable via mouse hover, keyboard focus, and touch — not hover-only

### Hero

- [ ] **HERO-05**: Hero's live-classification preview card visual details (bezel accents, radar sweep overlay, readout styling) are synced to the updated design file; the card remains fully static/fixture-driven

## v2 Requirements

None newly deferred by this milestone. See PROJECT.md's "Next Milestone Goals" for the standing v2 backlog (RSON-V2-01, SCEN-V2-01, FMT-01, RFCT-V2-01, HEALTH-CI-01, DEPENDABOT-01, AUDIT-01, ADR-CD-01, PREVIEW-01).

### Guided Tour

- **TOUR-03**: Guided Tour auto-launches on a user's first visit (vs. this milestone's manual "How to read this" trigger only) — needs its own first-visit-detection design, deferred per research (FEATURES.md)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Gallery card retains a direct `/s/{id}` permalink/navigation option alongside "Try on Sandbox" | User explicitly chose to fully switch to load-in-place, matching the design exactly — not a dual-mode card |
| Sandbox 6-chip preset row kept as a secondary shortcut alongside Gallery | User explicitly chose to remove it — Gallery becomes the sole scenario-loading entry point, matching the design exactly |
| DOM-anchored "spotlight" tour pointing at live page elements | Would justify a real tour library (Shepherd/Intro.js/Joyride); this milestone's tour is a self-contained modal per the design file |
| Post-load highlight/flash animation on the Sandbox beyond the scroll itself | Not shown in the design file; scroll-to-sandbox is sufficient acknowledgment |
| Any change to `classifyEncounter()`, geometry, or other `src/domain/` logic | This milestone is presentation-layer only, same boundary as v1.1 |

## Traceability

Populated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SBOX-06 | Phase 18 | Pending |
| SBOX-07 | Phase 18 | Pending |
| SBOX-08 | Phase 18 | Pending |
| SBOX-09 | Phase 20 | Pending |
| SBOX-10 | Phase 16 | Complete |
| TOUR-01 | Phase 19 | Pending |
| TOUR-02 | Phase 19 | Pending |
| GAL-05 | Phase 17 | Pending |
| GAL-06 | Phase 17 | Pending |
| HERO-05 | Phase 20 | Pending |

**Coverage:**
- v1 requirements: 10 total
- Mapped to phases: 10 (Phase 16: SBOX-10; Phase 17: GAL-05, GAL-06; Phase 18: SBOX-06, SBOX-07, SBOX-08; Phase 19: TOUR-01, TOUR-02; Phase 20: SBOX-09, HERO-05)
- Unmapped: 0 ✓

---
*Requirements defined: 2026-07-25*
*Last updated: 2026-07-25 after ROADMAP.md creation — 10/10 requirements mapped to Phases 16-20*
