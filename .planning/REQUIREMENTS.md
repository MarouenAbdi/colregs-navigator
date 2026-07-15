# Requirements: COLREGS Navigator

**Defined:** 2026-07-14
**Core Value:** Given any two-vessel encounter, correctly classify it under COLREGS and clearly explain — not just assert — which vessel must give way and why.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Vessel Model

- [x] **VESL-01**: User can set each vessel's position, heading, speed, and vessel type (power-driven, sailing, fishing, restricted-in-ability-to-maneuver) for two vessels
- [ ] **VESL-02**: User can drag/adjust a vessel's position and heading directly on the chart

### Classification

- [ ] **CLAS-01**: App classifies the encounter as head-on, crossing, or overtaking per COLREGS Rules 12–15, using relative bearing (not heading difference alone)
- [ ] **CLAS-02**: App evaluates overtaking before head-on/crossing, per Rule 13's explicit precedence, and does not flip an established overtaking situation to crossing as bearing drifts
- [ ] **CLAS-03**: App gates classification on risk of collision (Rule 7) so diverging/parallel vessels are not given a confident give-way verdict
- [ ] **CLAS-04**: App treats near-boundary cases (22.5°-abaft-the-beam, reciprocal-heading) as an explicit doubt/ambiguous state rather than a hard cutoff
- [ ] **CLAS-05**: Classification updates live as vessel position/heading/speed change (no manual submit step)

### Determination

- [ ] **DETM-01**: App determines which vessel is give-way and which is stand-on, per Rules 13/14/15/17
- [ ] **DETM-02**: App applies the Rule 18 vessel-type hierarchy (power-driven, sailing, fishing, restricted-in-ability-to-maneuver) as an override layer on top of the geometric baseline, treating "not under command" and "restricted in ability to maneuver" as co-equal status
- [ ] **DETM-03**: Give-way and stand-on vessels are visually distinguished on the chart (e.g. color/icon coding)

### Reasoning

- [ ] **RSON-01**: App displays a reasoning trail showing the specific rule(s) applied and the geometric logic (relative bearing, closing angle) that produced the verdict
- [ ] **RSON-02**: The reasoning trail is produced as a byproduct of the same rule-evaluation logic that determines the verdict (not reverse-engineered after the fact)
- [ ] **RSON-03**: App visually overlays the geometric reasoning directly on the chart (relative bearing line, and the overtaking boundary arc where relevant)

### Chart & Visualization

- [ ] **CHRT-01**: App renders a 2D nautical-chart-style canvas showing vessel position, heading, and encounter geometry
- [ ] **CHRT-02**: Chart rendering and drag interaction stay responsive during continuous drag (no lag or flicker from re-computation)

### Scenarios & Sharing

- [ ] **SCEN-01**: User can save a scenario and receive a shareable link, with no login required
- [ ] **SCEN-02**: Loading a shared scenario always re-runs classification from the saved inputs (never trusts a stored verdict)
- [ ] **SCEN-03**: User can browse a curated gallery of 5–8 classic textbook encounters (clean head-on, crossing, and overtaking cases)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Reasoning & Gallery Depth

- **RSON-V2-01**: Ambiguous/edge-case scenarios added to the curated gallery (e.g. near-boundary head-on/crossing, Rule 17(a)(ii) doubt situations)

### Sharing Polish

- **SCEN-V2-01**: Auto-generated social preview image (OG image) per shared scenario

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Multi-vessel (3+) conflict resolution | Separate, larger domain-modeling problem; core value is proving the two-vessel rules engine is correct and explainable first |
| Lights/shapes/sound-signal and restricted-visibility rules (Rules 19, 32–37) | Mostly lookup-table facts with low architectural depth relative to effort; would roughly double rule-coverage scope without strengthening the domain-modeling showcase |
| Real AIS data ingestion/replay | Separate data-engineering concern, not a rules-engine concern; sandbox + curated presets are sufficient to demonstrate and test the engine |
| User accounts / authentication | Scenarios are shareable by link; auth adds an entire subsystem unrelated to the rules-engine domain logic this project exists to showcase |
| Gamification (scoring, streaks, leaderboards) | Actively conflicts with the reasoning-trail-first UX — turns "explain reasoning" into "guess the answer" |
| Full ARPA/radar bridge simulation (multiple AIS targets, true/relative motion modes) | Explodes scope into a full navigation-simulator product; a different, much larger project |
| Native mobile app | Doubles delivery surface for no domain-modeling value; audience is interviewers reviewing a portfolio link, not boaters at the helm |
| Photorealistic/3D bridge or ECDIS-fidelity rendering | High cost for a feature that doesn't strengthen correctness/explainability; risks reading as a graphics showcase instead of a domain-modeling one |
| Employer/industry-specific framing | Kept as a general maritime-rules showcase, not tied to any specific company |

## Traceability

Populated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| VESL-01 | Phase 1 - Domain Foundations | Complete |
| VESL-02 | Phase 4 - Interactive Chart Sandbox | Pending |
| CLAS-01 | Phase 2 - COLREGS Rules Engine | Pending |
| CLAS-02 | Phase 2 - COLREGS Rules Engine | Pending |
| CLAS-03 | Phase 2 - COLREGS Rules Engine | Pending |
| CLAS-04 | Phase 2 - COLREGS Rules Engine | Pending |
| CLAS-05 | Phase 4 - Interactive Chart Sandbox | Pending |
| DETM-01 | Phase 2 - COLREGS Rules Engine | Pending |
| DETM-02 | Phase 2 - COLREGS Rules Engine | Pending |
| DETM-03 | Phase 4 - Interactive Chart Sandbox | Pending |
| RSON-01 | Phase 4 - Interactive Chart Sandbox | Pending |
| RSON-02 | Phase 2 - COLREGS Rules Engine | Pending |
| RSON-03 | Phase 4 - Interactive Chart Sandbox | Pending |
| CHRT-01 | Phase 4 - Interactive Chart Sandbox | Pending |
| CHRT-02 | Phase 4 - Interactive Chart Sandbox | Pending |
| SCEN-01 | Phase 5 - Save, Share & Gallery | Pending |
| SCEN-02 | Phase 3 - Persistence & API Layer | Pending |
| SCEN-03 | Phase 5 - Save, Share & Gallery | Pending |

**Coverage:**
- v1 requirements: 18 total
- Mapped to phases: 18/18
- Unmapped: 0

---
*Requirements defined: 2026-07-14*
*Last updated: 2026-07-14 after roadmap creation (18/18 v1 requirements mapped to 5 phases)*
