# Feature Research

**Domain:** Maritime COLREGS collision-avoidance rules-engine visualizer (scenario sandbox, educational/portfolio tool)
**Researched:** 2026-07-14
**Confidence:** MEDIUM-HIGH (COLREGS rule content is HIGH confidence — public, well-documented maritime law, cross-verified across multiple sources; competitor/UX feature patterns are MEDIUM confidence — verified against live product pages but this exact "explainable rules-engine visualizer" sub-category has few direct comparables, so some conclusions are inferred by analogy to adjacent tool categories)

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete or untrustworthy to anyone with maritime-training or dev-tool-sandbox context.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Per-vessel setup: position, heading, speed, vessel type | Every COLREGS trainer (SkipperCheck Bridge Simulator, Columbia's COLREGs Challenge, ColRegs Collaborative VR) starts from configuring vessel state before showing an encounter | LOW-MEDIUM | Already in PROJECT.md active requirements; needs a clean domain model (Vessel value object) since it feeds everything downstream |
| Encounter classification (head-on / crossing / overtaking) | This is the universal first output of every rules-of-the-road trainer found (SkipperCheck game, Columbia app, academic collision-avoidance literature all use this exact 3-way taxonomy) | MEDIUM | Rule 11 gates applicability ("vessels in sight of one another"); Rules 12–15 do the classification math (relative bearing, aspect) |
| Give-way / stand-on determination, clearly labeled | Every single competitor tool reduces to this binary — it's the "answer" users are drilling for (SkipperCheck's game literally asks "stand-on or give-way?") | LOW-MEDIUM | Rules 13 (overtaking), 14 (head-on — both give-way), 15 (crossing), 17 (stand-on duty), plus Rule 18 hierarchy override |
| Rule citation shown with the verdict | SkipperCheck's game explicitly "shows which rule applied plus a short explanation"; every study resource (ecolregs.com, safe-skipper.com) organizes content by rule number — users expect to see "Rule 15" not just "you must turn" | LOW | Cheap once the rules engine returns a structured verdict object (ruleId + text) |
| Visual chart/plot rendering with vessel position + heading | Every simulator reviewed (SkipperCheck's radar PPI, Columbia's ECDIS-style mode, RORSIM's 3D bridge) renders geometry visually, not just as text/numbers — plain text-only verdicts read as incomplete for a navigation tool | MEDIUM-HIGH | This is also the differentiator surface (see below) — table-stakes bar is "show the vessels and their headings on something chart-like," not full ECDIS fidelity |
| Instant/live feedback on parameter change | SkipperCheck's quiz gives feedback "instantly" per round; users configuring a sandbox expect the verdict to update as they adjust inputs, not require a manual "submit" | MEDIUM | Drives an architecture requirement: classification must be fast enough to run on every drag tick (client-side or near-instant tRPC round trip) |
| Curated set of classic/textbook encounter examples | Every COLREGS educational resource (textbooks, ecolregs.com, safe-skipper.com quizzes) teaches via canonical diagrams — "the" head-on case, "the" crossing case, "the" overtaking case are pedagogically standard; a rules-visualizer without these feels like it's missing the obvious starting point | LOW-MEDIUM | Can be implemented as pre-seeded rows in the same scenario-save data model — see Feature Dependencies |
| No-login shareable link for a scenario | Table stakes for the entire "sandbox tool" category this product also belongs to (regex101, Algorithm Visualizer, See Algorithms, AlgoVis.io, Excalidraw-style tools) — permalink sharing with zero signup is the default expectation for browser-based sandboxes in 2026 | LOW-MEDIUM | PROJECT.md already scopes this in; needs only scenario state serialization + a short ID, no auth |
| Clear visual role coding (give-way vs stand-on) | Bridge simulators use color/danger classification on radar targets (SkipperCheck's "danger classifications"); users scan visually before reading text | LOW | Simple color/icon convention (e.g., red = give-way, green = stand-on) applied to vessel markers |

### Differentiators (Competitive Advantage)

Features that set the product apart from existing COLREGS trainers and quiz apps. Should align with PROJECT.md's stated core value: correct, *transparent* reasoning — not just a verdict.

| Feature | Value Proposition | Complexity | Notes |
|---------|--------------------|------------|-------|
| Geometric reasoning overlaid directly on the chart (relative bearing line, closing angle, the 22.5°-abaft-the-beam overtaking boundary) | Competitor tools show either a text rule citation (SkipperCheck game) or raw radar CPA/TCPA numbers (SkipperCheck simulator) — none combine "here is the exact angle that triggered this rule" as a live visual annotation tied to the verdict. This is the single clearest way to make the domain-model reasoning legible, which is the whole point of the project per PROJECT.md | MEDIUM-HIGH | Requires computing and rendering: relative bearing vector, own-ship-relative aspect angle, and (for overtaking) the abaft-the-beam threshold arc |
| Step-by-step reasoning trail / decision audit (Rule 11 applicability → 12/13/14/15 classification → 18 vessel-type override → 17 stand-on duty) | Quiz tools give a single flat "Rule X applies" answer. Exposing the *chain* of rule evaluation as a visible trace demonstrates the rules-engine/state-machine architecture itself — directly serves the portfolio's interview goal of showing domain-modeling depth, not just a correct final answer | MEDIUM | This is as much a UI feature as a domain-layer design constraint: the engine should return an ordered list of evaluated rules/conditions, not just a final verdict, so the UI has something to render |
| Continuous live drag-and-recompute (vs. discrete scenario stepping) | SkipperCheck's simulator moves vessels via ± buttons in fixed increments; a draggable, continuously-recomputing sandbox is a smoother, more exploratory interaction that better supports "what if I nudge the heading 5° — does the classification flip?" — which is exactly the kind of edge-case exploration that shows rule-boundary understanding | MEDIUM-HIGH | Already an active PROJECT.md requirement; the differentiation is in polish/responsiveness, not just existence |
| Explicit Rule 18 vessel-type hierarchy modeled and explained (power-driven, sailing, fishing, restricted-in-ability-to-maneuver overriding the geometric verdict) | Simple quiz tools and most "who gives way" explainers stop at power-vs-power geometry. Modeling the hierarchy as an explicit override layer — and showing *why* a sailing vessel becomes stand-on despite crossing geometry — is a richer domain-modeling showcase and matches an active PROJECT.md requirement | MEDIUM-HIGH | Natural fit for a decorator/strategy pattern in the domain layer; good architecture-story material for interviews |
| Portfolio-quality curated gallery with written rationale per preset ("why this is the textbook head-on case") | Competitor tools list scenarios (SkipperCheck's 54 scenarios) but as training drills, not annotated reference cases. A small, high-quality gallery with a sentence of "why this matters" per entry reads as curated expertise rather than bulk content — better fit for a portfolio piece than breadth | LOW-MEDIUM | Depends on save/share data model (see dependencies); mostly a content/curation effort once the model exists |
| Deep-linkable, embeddable scenario state (rich preview / OG image on share) | None of the competitor tools reviewed support this — most are session-based drills, not persistent shareable artifacts. A shareable link with a good social preview makes the tool easy to drop into a resume/portfolio README or LinkedIn post, which matters for this project's actual goal (interview visibility) | LOW-MEDIUM | Server-rendered OG image or static chart snapshot per saved scenario; nice-to-have polish, not core logic |
| Surfacing genuine rule ambiguity/edge cases (e.g., near-000°/180° head-on/crossing boundary, Rule 17(a)(ii) "in extremis" doubt situations) | Training quiz apps deliberately pick clean-cut scenarios so answers are unambiguous (needed for scoring). A sandbox tool has no such constraint — showing that the engine correctly handles boundary/ambiguous cases (and explains the ambiguity rather than hiding it) is a stronger demonstration of domain understanding | MEDIUM-HIGH | Higher research/testing burden — these are exactly the cases where naive implementations get COLREGS wrong; good target for the TDD-focused testing strategy in PROJECT.md |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good — and that competitor tools often have — but would dilute this project's focused scope or its actual (portfolio) goal.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|------------------|-------------|
| Full ARPA/radar bridge simulation (multiple AIS targets, CPA/TCPA plotting, vector true/relative motion modes) | SkipperCheck's flagship product is exactly this, and it looks impressive/comprehensive | Explodes scope far beyond a 2-vessel rules engine into a full navigation-simulator product; PROJECT.md explicitly scopes out multi-vessel and real AIS data for good reason — this is a different (much larger) project | Keep the chart a clean 2-vessel geometric sandbox; if multi-vessel is ever wanted, it's an explicit, separately-scoped v2 |
| Gamification: scoring, streak bonuses, leaderboards | SkipperCheck's quiz game and most COLREGS learning apps use this to drive engagement/retention | Turns the tool from "explain reasoning" into "guess the answer," which undercuts the core value (transparency over quizzing) and pulls UI/backend effort toward session/leaderboard state instead of the domain layer that's the actual point of the portfolio piece | If engagement is desired later, prefer a "try to predict, then reveal the reasoning trail" soft-check pattern — no scores, no leaderboard, no persistence of "performance" |
| User accounts, saved history, favorites/bookmarks | Natural extension once you have shareable scenarios — "why not let me log in and see my saved list?" | PROJECT.md explicitly excludes auth to keep scope minimal; accounts add an entire auth/session subsystem that has nothing to do with the rules-engine domain logic this project exists to showcase | Anonymous link-based saves only; a scenario's shareable URL *is* its persistence mechanism |
| Real AIS live-data feed / historical replay | Would make the tool feel "real" and connected to actual shipping traffic | PROJECT.md explicitly excludes this — it's a data-engineering/integration problem, not a domain-modeling one, and pulls focus from the rules engine | Manual sandbox + curated presets are sufficient to demonstrate and test the rules engine thoroughly |
| Full lights/shapes/sound-signal rules and restricted-visibility rules (Rules 19, 32–37) | Comprehensive COLREGS trainers (Columbia's app, SkipperCheck) cover these as part of "complete" rules-of-the-road training | PROJECT.md explicitly scopes to Rules 11–18 (steering/sailing, vessels in sight of one another) because that's the richest state-machine/classification target; lights/sound rules are mostly lookup-table facts, not much added architectural depth, and would roughly double scope | Keep to Rules 11–18; if desired, a brief "out of scope" disclaimer in the UI rather than partial/shallow coverage of the broader rule set |
| Native mobile app | Several competitor tools (ColRegs Rules of the Road, Columbia's app) are mobile-first, and "mobile app" feels more polished/complete | Doubles the delivery surface (build, ship, maintain two platforms) for a project whose PROJECT.md tech stack and goals are web-first (Next.js/React); adds no domain-modeling value, only cost | Responsive web app only; mobile-friendly layout is enough since the real audience is interviewers reviewing a portfolio link, not boaters at the helm |
| Photorealistic/gamey 3D bridge or ECDIS-fidelity chart rendering | RORSIM and VR trainers use immersive 3D to maximize realism, and it's visually impressive in a demo | High implementation cost for a feature that doesn't strengthen the actual value proposition (correct + explainable classification); risks the project reading as a graphics showcase rather than a domain-modeling showcase, and eats time that should go to the rules engine and its test suite | A clean, restrained 2D nautical-chart-style canvas (compass rose, simple vessel glyphs, bearing lines) — enough visual credibility without competing on production values |

## Feature Dependencies

```
Vessel setup (position, heading, speed, type)
    └──requires──> (nothing — foundational input)

Encounter classification (head-on / crossing / overtaking)
    └──requires──> Vessel setup

Give-way / stand-on determination
    └──requires──> Encounter classification
    └──requires──> Rule 18 vessel-type hierarchy (as an override layer, when vessel types differ)

Reasoning trail (rule citation + geometric explanation)
    └──requires──> Give-way / stand-on determination
                       └──requires──> Encounter classification
                                          └──requires──> Vessel setup

Geometric overlay on chart (relative bearing line, closing angle, overtaking boundary arc)
    └──enhances──> Reasoning trail
    └──requires──> Visual chart rendering

Live drag-and-adjust with real-time reclassification
    └──requires──> Encounter classification (must be fast/synchronous)
    └──enhances──> Visual chart rendering

Scenario save/share (shareable link, no login)
    └──requires──> Vessel setup (state to serialize)

Curated preset gallery
    └──requires──> Scenario save/share (presets are pre-seeded saved scenarios)

Deep-linkable / embeddable preview (OG image)
    └──requires──> Scenario save/share

Rule 18 vessel-type hierarchy
    └──enhances/overrides──> Encounter classification → Give-way/stand-on determination (sequential override, not a conflict: geometry runs first, hierarchy can then supersede the geometric default)

Gamification/scoring ──conflicts──> Reasoning-trail-first UX
Real AIS data / multi-vessel ──conflicts──> Focused 2-vessel scope (PROJECT.md Out of Scope)
```

### Dependency Notes

- **Give-way/stand-on determination requires encounter classification:** you cannot apply Rules 13/14/15/17 until the encounter has been categorized as overtaking, head-on, or crossing — this ordering should be reflected directly in the domain layer (a classification step that produces a typed result consumed by the determination step).
- **Reasoning trail requires determination, which requires classification, which requires vessel setup:** this is a strict pipeline. It strongly suggests a phase-by-phase build order (vessel model → classification → determination/Rule 18 → explanation/reasoning trail → visualization polish) rather than building the UI shell first.
- **Geometric overlay enhances the reasoning trail:** the overlay isn't a separate feature so much as a rendering of the same data the reasoning trail already needs (bearing, angle) — build the geometry calculations once and drive both the text explanation and the visual annotation from it.
- **Curated preset gallery requires save/share:** presets should not be a separate hardcoded feature — model them as scenarios saved through the same mechanism regular users get, just seeded and flagged as "featured." This avoids building two data models for one concept.
- **Rule 18 hierarchy overrides classification, doesn't conflict with it:** power-driven-vs-power-driven geometry (Rules 12–15) still runs first to establish the baseline; Rule 18 then adjusts which vessel is give-way based on vessel type. Model this as a decorator/override step after the base classification, not as a competing classification path.
- **Gamification conflicts with the reasoning-trail-first UX:** scoring/streaks push users toward fast guessing (SkipperCheck's model), while this project's core value is slow, visible reasoning — don't combine the two interaction models in the same core loop.
- **Real AIS/multi-vessel conflicts with the focused scope:** both were explicitly excluded in PROJECT.md; flagging here only to confirm the research doesn't surface a compelling reason to reconsider — competitor analysis shows these are what turn a project into a much larger navigation-simulator product (SkipperCheck's paid tier), not what a focused 2-vessel showcase needs.

## MVP Definition

### Launch With (v1)

Minimum viable product — validates that the rules engine is correct and the reasoning is genuinely legible, which is the entire point of the project.

- [ ] Vessel setup: position, heading, speed, type for two vessels — foundational input, nothing else works without it
- [ ] Live encounter classification (head-on / crossing / overtaking) for power-driven vessels, Rules 12–15 — the core domain logic the whole project exists to showcase
- [ ] Give-way/stand-on determination, Rules 13/14/15/17 — the "answer" users came for
- [ ] Reasoning trail: rule citation + geometric explanation (relative bearing, closing angle) in text — explainability is called out as first-class in PROJECT.md; must ship in v1, not bolted on later
- [ ] Visual chart rendering with vessel position/heading and basic bearing indicator — table stakes across every competitor reviewed
- [ ] Live drag-and-adjust with real-time reclassification — an active PROJECT.md requirement and the main interaction loop
- [ ] Save scenario + shareable link, no login — active PROJECT.md requirement, and table stakes for the sandbox-tool category
- [ ] Curated gallery of 5–8 classic preset encounters — gives new visitors an immediate way to see the tool work without configuring anything themselves

### Add After Validation (v1.x)

Features to add once the core classify → explain → visualize loop is proven correct and legible.

- [ ] Rule 18 vessel-type hierarchy (sailing, fishing, restricted-in-ability-to-maneuver overrides) — add once the power-driven baseline is solid; trigger: base engine is fully tested and the UI reasoning trail reads well
- [ ] Geometric overlay drawn on the chart itself (bearing line, overtaking boundary arc), not just described in text — trigger: text-based explanation is validated as correct/clear, then invest in the higher-effort visual layer
- [ ] Deep-link social preview (OG image per shared scenario) — trigger: share feature is used/tested and worth making presentable for portfolio distribution
- [ ] Edge-case/ambiguous scenarios added to the gallery (near-boundary head-on/crossing, Rule 17(a)(ii) doubt situations) — trigger: base classification is proven correct on clean-cut cases first

### Future Consideration (v2+)

Features to defer — explicitly out of scope per PROJECT.md, revisit only if the project's goals change (e.g., extending beyond portfolio use).

- [ ] Multi-vessel (3+) conflict resolution — defer: a genuinely separate, larger domain-modeling problem; only worth it if v1's 2-vessel engine is fully proven and there's appetite for a v2 milestone
- [ ] Lights/shapes/sound-signal and restricted-visibility rules (Rules 19, 32–37) — defer: lower architectural value (mostly lookup tables) relative to effort; would roughly double rule-coverage scope
- [ ] Real AIS data ingestion/replay — defer: separate data-engineering concern, not a rules-engine concern
- [ ] User accounts/auth — defer: no functional need while sharing is link-based; only reconsider if a "my saved scenarios" feature becomes a real user request post-launch

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|----------------------|----------|
| Vessel setup (position/heading/speed/type) | HIGH | LOW | P1 |
| Encounter classification (head-on/crossing/overtaking) | HIGH | MEDIUM | P1 |
| Give-way/stand-on determination | HIGH | LOW-MEDIUM | P1 |
| Reasoning trail (rule citation + text explanation) | HIGH | LOW-MEDIUM | P1 |
| Visual chart rendering | HIGH | MEDIUM-HIGH | P1 |
| Live drag-and-adjust | HIGH | MEDIUM | P1 |
| Save/share scenario (no login) | HIGH | LOW-MEDIUM | P1 |
| Curated preset gallery | MEDIUM-HIGH | LOW-MEDIUM | P1 |
| Rule 18 vessel-type hierarchy | HIGH (for domain-modeling story) | MEDIUM-HIGH | P2 |
| Geometric overlay on chart (bearing line, boundary arc) | MEDIUM-HIGH | MEDIUM-HIGH | P2 |
| Deep-link social preview (OG image) | LOW-MEDIUM | LOW-MEDIUM | P3 |
| Ambiguous/edge-case gallery entries | MEDIUM | MEDIUM | P3 |
| Multi-vessel resolution | MEDIUM (out of scope) | HIGH | P3 (deferred) |
| Lights/shapes/sound signals | LOW (out of scope) | HIGH | P3 (deferred) |
| Real AIS integration | LOW (out of scope) | HIGH | P3 (deferred) |
| Gamification/scoring | LOW (anti-feature) | MEDIUM | P3 (do not build) |
| User accounts/auth | LOW (out of scope) | MEDIUM | P3 (do not build) |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have / deferred / explicitly not building

## Competitor Feature Analysis

| Feature | SkipperCheck (Simulator + Game) | Columbia COLREGs Challenge App | COLREGS Navigator (our approach) |
|---------|----------------------------------|----------------------------------|-------------------------------------|
| Scope | Full ARPA/radar bridge sim (54 scenarios, Rules 5–19) + separate quiz game (Rules 12–30) | Gamified mobile/web app: navigation, collision avoidance, lights/shapes, sound signals | Focused 2-vessel sandbox, Rules 11–18 only |
| Vessel input | Randomized AIS targets per scenario; player maneuvers own ship via ± COG/SOG buttons | Scenario-driven within mini-games (radar sim, ECDIS-style, bridge view) | Direct manual control: position, heading, speed, type for both vessels, freely adjustable |
| Feedback mechanism | Game: instant correct/incorrect + rule + short explanation. Simulator: scenario briefing pages with rule citations, common mistakes | Reaction-based mini-games and modules; feedback style not detailed in available sources | Persistent reasoning trail (rule citation + geometric explanation), visible before and after any answer — not a graded quiz |
| Visualization | Radar PPI with AIS vectors, CPA/TCPA, danger classification (simulator) | ECDIS-style and bridge-view rendering | Restrained nautical-chart-style 2D canvas with bearing/angle overlay tied directly to the explanation |
| Engagement model | Scoring, streak bonuses, global leaderboard (game); paid course/subscription tiers (simulator) | Gamified modules across multiple play styles | No scoring/leaderboard — exploratory sandbox, engagement via curated gallery + shareability |
| Sharing/persistence | None found (session-based drills; simulator scenarios gated behind paid access) | None found | Shareable no-login link per scenario; curated preset gallery seeded from the same mechanism |
| Vessel-type/Rule 18 hierarchy | Not confirmed in available sources (breadth-focused, Rules 5–30) | Not confirmed in available sources | Explicit, explained override layer — a stated differentiator |
| Access model | Freemium (7 free scenarios; rest paywalled) | App store download | Fully open web tool, no paywall, no login — matches portfolio/demo goal |

## Sources

- [SkipperCheck: ARPA/AIS/COLREG Bridge Simulator](https://skippercheck.net/colreg-simulator) — fetched and analyzed directly; MEDIUM confidence (single-source product page, but directly verified)
- [SkipperCheck COLREG Practice Game](https://skippercheck.net/colreg-game) — fetched and analyzed directly; MEDIUM confidence
- [Columbia launches gamified COLREGs training app — Smart Maritime Network](https://smartmaritimenetwork.com/2025/07/29/columbia-launches-gamified-colregs-training-app/) — MEDIUM confidence, third-party news coverage
- [ColRegs Collaborative VR Training](https://chaac.tech/solutions/military-immersive-training/colregs-collaborative) — LOW-MEDIUM confidence, vendor marketing page, not independently verified in depth
- [RORSIM: warship collision avoidance 3D simulation — Springer](https://link.springer.com/article/10.1007/s10055-013-0223-z) — MEDIUM confidence, peer-reviewed but describes a specialized military trainer, limited direct comparability
- [ColRegs: Rules of the Road App — App Store](https://apps.apple.com/us/app/colregs-rules-road-for-all/id494839562) — LOW confidence, listing only, not deeply analyzed
- [ecolregs.com — COLREGs course, Rule 17](https://ecolregs.com/index.php?option=com_k2&view=item&layout=item&id=57&Itemid=390&lang=en) — HIGH confidence for rule content (established maritime education reference)
- [Safe Skipper — give-way hierarchy at sea](https://www.safe-skipper.com/the-give-way-hierarchy-at-sea-who-gives-way-to-whom/) — MEDIUM-HIGH confidence for Rule 18 hierarchy content
- [US DHS/USCG Navigation Rules PDF](https://www.navcen.uscg.gov/sites/default/files/pdf/navRules/navrules.pdf) — HIGH confidence, official regulatory text
- Academic literature on encounter classification (crossing/overtaking/head-on taxonomy) — MEDIUM-HIGH confidence, consistent across multiple peer-reviewed sources (Frontiers in Marine Science, MDPI, arXiv preprints on COLREGs-compliant collision avoidance)
- Analogous sandbox/dev-tool patterns: Algorithm Visualizer, See Algorithms, AlgoVis.io — MEDIUM confidence for the "no-login shareable permalink" pattern, inferred by analogy from adjacent (non-maritime) sandbox-tool category, not maritime-specific

---
*Feature research for: maritime COLREGS collision-avoidance rules-engine visualizer*
*Researched: 2026-07-14*
