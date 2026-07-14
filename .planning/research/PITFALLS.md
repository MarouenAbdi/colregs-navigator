# Pitfalls Research

**Domain:** Maritime collision-avoidance (COLREGS) rules-engine + interactive 2D chart visualizer
**Researched:** 2026-07-14
**Confidence:** MEDIUM-HIGH (COLREGS rule semantics are HIGH confidence — sourced from multiple maritime training/reference sites that agree; software-architecture and canvas/UI pitfalls are MEDIUM — sourced from community engineering writing, not a single authoritative spec)

## Critical Pitfalls

### Pitfall 1: Checking heading difference instead of the actual Rule 13/14/15 tests (relative bearing, not just relative heading)

**What goes wrong:**
Developers new to COLREGS often implement classification as "compare the two vessels' headings" (e.g., `headingDiff < 15° → head-on`, `headingDiff ≈ 90° → crossing`). This is wrong. COLREGS classification is defined primarily in terms of **relative bearing** (where vessel B appears, as seen from vessel A's bow) and **secondarily** by heading similarity — not heading difference alone:
- Rule 14 (head-on) requires **two** conditions: reciprocal/nearly-reciprocal courses **and** each vessel sees the other "ahead or nearly ahead" (i.e., near 0° relative bearing from both perspectives). A crossing situation with near-parallel headings but off-axis relative bearing is not head-on.
- Rule 13 (overtaking) is defined **entirely** by relative bearing (>22.5° abaft the other vessel's beam), regardless of the overtaking vessel's own heading — a vessel can be "overtaking" even while turning or on a very different heading than the vessel it is overtaking.
- Rule 15 (crossing) give-way determination depends on which vessel has the other "on her own starboard side" — a bearing-sign question, not a heading-difference question.

**Why it happens:**
Heading-difference is the intuitive first model because it's simpler to compute (one subtraction) and "feels" like it captures head-on vs. crossing. Relative bearing requires computing a full geometry pipeline (position vectors, bearing from A to B, bearing from B to A, normalizing both to a consistent 0–360° or -180–180° convention) which is more work and easier to get subtly wrong.

**How to avoid:**
Model the domain explicitly around two independent geometric primitives before writing any classification rule: (1) **relative bearing of B as seen from A's bow** and (2) **relative bearing of A as seen from B's bow** — these are NOT the same value and are NOT simply 180° apart unless headings are involved correctly. Write these as pure, independently unit-tested functions first. Only compose classification rules on top of verified geometry primitives.

**Warning signs:**
- Classification logic that only ever computes one bearing value and reuses it for both vessels.
- Rule 14 (head-on) implemented as a single condition instead of two ANDed conditions.
- No unit tests where heading difference is ~180° (reciprocal) but relative bearing is off-axis (should NOT be head-on — it's likely two vessels crossing on parallel-ish tracks, not meeting bow-to-bow).

**Phase to address:**
Domain modeling / rules-engine core phase (before any UI work) — geometry primitives must be correct and independently tested before classification rules are built on top of them.

---

### Pitfall 2: Wrong evaluation order — checking head-on/crossing before overtaking

**What goes wrong:**
Rule 13 opens with "Notwithstanding anything contained in Rules 4–18, any vessel overtaking any other shall keep out of the way of the vessel being overtaken" — overtaking **takes precedence over and overrides** the head-on and crossing rules. If a classifier evaluates head-on/crossing first and only falls back to overtaking as a last case, it will misclassify legitimate overtaking situations (e.g., a much faster vessel approaching from behind on a heading that happens to differ significantly from the leading vessel's heading) as crossing situations, producing the wrong give-way vessel.

**Why it happens:**
Rules 11–18 are numbered and often mentally implemented in numeric order (14 before 13, or "classify by heading pattern" before "classify by position"), which is the opposite of the precedence the regulations actually require. The 22.5°-abaft-the-beam test is also easy to skip because it requires the relative-bearing primitive from Pitfall 1.

**How to avoid:**
Evaluate the overtaking test **first**, using relative bearing only (not heading). Only if overtaking does not apply, proceed to test head-on, then crossing. Encode this as an explicit, ordered decision structure (not implicit if/else fallthrough) so the precedence is visible and testable in isolation. Also implement the "sticky" rule: once an overtaking situation is established, it must not be reclassified as crossing later even if the relative bearing subsequently changes (COLREGS explicitly forbids this) — this matters for the live-drag interaction where the user can nudge a vessel from clearly-overtaking into the ambiguous zone.

**Warning signs:**
- Classification function structured as `if headOn() else if crossing() else overtaking()`.
- No test with a fast vessel approaching from ~30–60° abaft the beam on a very different heading than the lead vessel (this should be overtaking, not crossing, despite the heading difference).

**Phase to address:**
Domain modeling / rules-engine core phase — this is a rule-ordering/precedence decision that belongs in the core classification algorithm design, not something to patch on later.

---

### Pitfall 3: Treating the 22.5°-abaft-the-beam and near-reciprocal-heading boundaries as exact instead of applying the "in doubt" rule

**What goes wrong:**
COLREGS Rules 13 and 14 both contain an explicit "if in doubt, assume the more cautious classification" clause: doubt about overtaking → assume overtaking; doubt about head-on → assume head-on and act accordingly. A naive implementation treats `22.5°` and `reciprocal heading` as exact floating-point thresholds. Two problems follow: (a) a vessel dragged to exactly 22.5° or 180.0° can flip unpredictably between classifications due to floating-point rounding, causing verdict "flicker" during live drag; (b) the engine has no representation for the "ambiguous zone" the rules explicitly acknowledge exists, so it cannot show the doubt-favors-caution reasoning that is core to the product's "explain, don't just assert" value proposition.

**Why it happens:**
Regulatory text written for human judgment ("in doubt... shall assume") does not translate directly into a deterministic boolean function. Developers default to picking an arbitrary hard cutoff because it's easy to code, without designing for the ambiguous band the rule anticipates.

**How to avoid:**
Model doubt-triggering thresholds explicitly (e.g., a narrow band around 22.5° and around 0°/180° heading reciprocality) as first-class domain concepts, and make the "assume the cautious case" behavior an explicit, tested rule outcome — not an accidental side effect of comparison operators. This also directly enables the "reasoning trail" feature: the explanation can literally say "bearing was within the doubt band near the overtaking/crossing boundary; COLREGS Rule 13 requires assuming overtaking in this case."

**Warning signs:**
- Threshold comparisons using `<` / `>` with no tolerance or epsilon.
- No UI/domain concept of "boundary/ambiguous encounter" distinct from "clear-cut encounter."
- Live-drag demo shows the verdict rapidly toggling between two classifications as the vessel crosses a boundary angle.

**Phase to address:**
Rules-engine core phase for the domain modeling; explainability/reasoning-trail phase for surfacing the doubt logic in the UI.

---

### Pitfall 4: Classifying encounters without first checking whether risk of collision exists (Rule 7 precondition)

**What goes wrong:**
Rules 11–18 only matter when a "risk of collision" exists between the two vessels (established under Rule 7 — bearing not appreciably changing while range decreases, i.e., a converging/closing geometry). A classifier that ignores this precondition will produce a confident "head-on, vessel A must give way" verdict even for two vessels that are diverging, running parallel and never closing, or already past and clear — situations where COLREGS doesn't actually assign a give-way obligation because there's no risk to begin with. This produces verdicts that look plausible but are operationally nonsensical, undermining the product's core "correctly classify and explain" value.

**Why it happens:**
It's tempting to treat classification as a pure function of instantaneous position/heading/speed and skip the temporal "will these tracks actually converge" check, especially since Rules 11–18 text focuses on geometry, not motion prediction. But real encounter classification is meaningless without first confirming a collision risk trajectory.

**How to avoid:**
Compute a simple closest-point-of-approach (CPA) / time-to-CPA (TCPA) or bearing-rate check as a gating step before applying Rules 11–18. If CPA is large / bearing rate is significant (vessels diverging or passing at safe distance), report that explicitly ("no risk of collision — Rules 11–18 do not apply") rather than forcing a give-way verdict. This is a natural, valuable addition to the "reasoning trail" and should be scoped explicitly (even a simplified two-vessel CPA calc, since the project already excludes multi-vessel and live AIS data).

**Warning signs:**
- No CPA/TCPA or bearing-rate concept anywhere in the domain model.
- Demo scenario where two vessels are moving apart still produces a confident give-way verdict.

**Phase to address:**
Rules-engine core phase — decide explicitly whether Rule 7 gating is in scope (recommended: yes, minimal version) before building the classification pipeline, since it changes the shape of the domain model (adds a "risk of collision" concept prior to "encounter type").

---

### Pitfall 5: Rule 18 vessel-type hierarchy modeled as a strict linear pecking order

**What goes wrong:**
Rule 18 lists vessel categories (not under command, restricted in ability to maneuver, constrained by draft, fishing, sailing, power-driven) in an order that looks like a strict ranking, so developers implement it as `priority[typeA] > priority[typeB] → typeA is stand-on`. Two things break this: (1) "not under command" and "restricted in ability to maneuver" are **co-equal**, not ranked relative to each other, despite appearing in sequence in the rule text — mariners and examiners have flagged this as a persistent point of confusion IMO has declined to clarify; (2) Rule 18's hierarchy is explicitly subordinate to Rules 9 (narrow channels), 10 (traffic separation schemes), and 13 (overtaking) — "except where Rules 9, 10, and 13 otherwise require." Since this project scopes out Rules 9/10, that's fine, but Rule 13 is in scope, meaning the vessel-type hierarchy must NOT override an overtaking classification (overtaking vessel keeps clear regardless of relative vessel-type "rank").

**Why it happens:**
The rule text reads like an ordered list, and a simple integer-priority lookup table is the path of least resistance. The overtaking-overrides-hierarchy exception is easy to miss because it's a single subordinate clause at the start of Rule 18, not repeated at each vessel-type pairing.

**How to avoid:**
Model NUC and RAM as an unordered/co-equal set rather than two distinct priority integers. Apply the Rule 13 overtaking check (Pitfall 2) before ever consulting the Rule 18 vessel-type hierarchy — vessel type should only break ties/determine give-way when the encounter is head-on or crossing, never when it's overtaking.

**Warning signs:**
- A single flat `VESSEL_TYPE_PRIORITY` enum/array with NUC and RAM at distinct adjacent ranks used for direct comparison.
- Vessel-type hierarchy consulted before the encounter-type (head-on/crossing/overtaking) classification is finalized.

**Phase to address:**
Rules-engine core phase, specifically the vessel-type responsibility layer (Rule 18) that composes on top of encounter classification (Rules 13–15).

---

### Pitfall 6: Compass-bearing vs. math-angle convention mismatch

**What goes wrong:**
Nautical headings/bearings are measured **clockwise from North (0°/360°)**. `Math.atan2` and most graphics/canvas coordinate systems measure **counterclockwise from the positive x-axis**, and screen/canvas Y-axis typically increases **downward**, which flips the visual rotation sense yet again. Mixing these conventions produces vessels that visually point the wrong way, relative bearings that are mirrored or off by a sign, or verdicts that are correct in the domain model but rendered backwards on the chart (e.g., "give-way vessel has the other on her starboard side" computed correctly in domain space but displayed as if it were port side, due to an unconverted axis flip somewhere in the render pipeline).

**Why it happens:**
Three different angle/coordinate conventions are in play simultaneously (compass bearing for domain logic and user input, standard math radians for `atan2`/trig calls, and screen-space Y-down pixels for canvas/SVG rendering), and it's easy to apply only one conversion when two are needed, or to apply a conversion twice.

**How to avoid:**
Pick one canonical internal representation for all domain logic (recommended: compass bearing in degrees, 0–360°, clockwise from North) and write two small, independently unit-tested pure conversion functions at the system boundary: `compassBearingToCanvasRadians()` (for rendering) and `screenDeltaToCompassBearing()` (for interpreting drag/mouse input back into domain terms). Never let trigonometric math (`atan2`, `sin`/`cos`) touch raw compass bearings without going through these converters, and never let the renderer consume raw compass bearings without going through the inverse converter. Test the converters against known fixed points (North = 0° = "up" on screen, East = 90° = "right" on screen, etc.).

**Warning signs:**
- `atan2` results used directly as "bearing" without a `(90 - angle + 360) % 360`-style conversion (or equivalent) to compass convention.
- Vessel icons rendered pointing a visibly different direction than their stated heading in a demo scenario.
- Bugs that only appear in specific quadrants (e.g., southwest-heading vessels behave correctly but northwest-heading ones don't) — a classic symptom of an unhandled negative-angle wraparound after `atan2`.

**Phase to address:**
Split across two phases: the conversion functions themselves belong in the rules-engine/geometry core phase (as pure, tested utilities with no rendering dependency); the "is it actually drawn correctly" verification belongs in the canvas/visualization phase.

---

### Pitfall 7: Degenerate geometry inputs not handled (zero speed, identical position, exact reciprocal course)

**What goes wrong:**
A sandbox where users freely drag position/heading/speed will inevitably produce degenerate inputs: two vessels at the same position (bearing/relative-bearing undefined — division by zero or `atan2(0,0)`), a stationary vessel (speed = 0, so "relative motion" and thus overtaking/CPA calculations that depend on a velocity vector break down), or headings that are exactly reciprocal (180.000°) landing precisely on a classification boundary. If these aren't handled deliberately, the engine can throw runtime errors, return `NaN`, or silently produce a confident but meaningless verdict during normal interactive use — which is highly visible and embarrassing in a live-drag demo aimed at interviewers.

**Why it happens:**
Textbook COLREGS examples are always "clean" (vessels moving, positions distinct, angles not exactly on a boundary). Developers build and test against clean textbook scenarios and don't think to test what happens when a user drags a vessel on top of another or sets speed to 0.

**How to avoid:**
Enumerate degenerate cases explicitly as first-class test cases during rules-engine development: identical positions, zero speed on one or both vessels, exact boundary angles (0°, 22.5°, 180°, 360°), and anchored/stationary vessel types. Decide and document the intended behavior for each (e.g., "a stationary vessel cannot be classified as overtaking or being overtaken by relative motion in the usual sense — but Rule 13's geometric bearing test still applies since it doesn't require motion of the reference vessel") rather than discovering the behavior by accident via a UI crash.

**Warning signs:**
- No explicit test for `speed = 0` on either vessel.
- No explicit test for `positionA === positionB`.
- Dragging a vessel in the running dev build onto the other vessel's exact position crashes or shows `NaN`/`undefined` in the reasoning trail.

**Phase to address:**
Rules-engine core phase for behavior definition and unit tests; canvas/interaction phase for constraining or gracefully handling degenerate drag states in the UI (e.g., minimum separation snapping, disallowing exact overlap).

---

### Pitfall 8: Encoding rules as opaque imperative logic instead of an explainable decision structure

**What goes wrong:**
The single most important requirement in this project is that verdicts come with a **reasoning trail** — a rule citation plus the specific geometric facts that produced it. If the classification logic is written as a tangle of nested `if`/`else` and boolean flags optimized only for "produce the right final answer," retrofitting explainability later becomes a rewrite, not an addition: there's no natural place to capture "which specific fact caused which specific branch to be taken." This is the single highest-risk architectural mistake for this project because explainability is stated as the differentiator, not a nice-to-have.

**Why it happens:**
It's fast and natural to write classification as straight-line "compute the answer" code, especially under TDD pressure to make the next boolean assertion pass. Explainability then becomes an afterthought layered on with string concatenation ("if headOn: return 'Rule 14 applies'") that doesn't actually capture the geometric reasoning, only the label.

**How to avoid:**
Design the domain model so that every rule evaluation is a discrete, named step that returns both a verdict fragment and the specific inputs/thresholds it compared (e.g., a `RuleEvaluation` value object with `{ rule: 'Rule 13', matched: true, relativeBearing: 137.2, threshold: 157.5, explanation: '...' }`), and compose the final verdict from an ordered list of these evaluations. This is exactly what a rules-engine/state-machine architecture (per the project's DDD-lite ambitions) should produce naturally — treat "explainability" as a design constraint on the domain model's return type from day one, not a UI feature to bolt on afterward.

**Warning signs:**
- Classification function signature returns only a final enum/string verdict, no supporting facts.
- "Reasoning trail" text is generated by a separate function that re-derives explanations from the final verdict rather than being produced as a byproduct of the actual rule evaluation.
- Difficulty writing a unit test that asserts on *why* a verdict was reached, only what the verdict is.

**Phase to address:**
Must be decided in the rules-engine core / domain-modeling phase, before classification logic is written — this is an API/return-type design decision, not something fixed after the fact. The explainability/reasoning-trail feature phase then consumes this structure rather than building new inference on top of it.

---

### Pitfall 9: Live-drag interaction re-triggers full classification (and potentially persistence) on every mouse-move frame

**What goes wrong:**
The requirement "user can drag vessel position/heading and see the encounter classification update live" invites naively wiring the drag handler's `onMouseMove` directly to both the classification recompute AND to state that's bound to network calls (tRPC mutations / autosave), causing dozens of classification calls and potentially network requests per second during a single drag gesture. At minimum this causes UI jank; at worst it causes redundant/racing tRPC calls, database writes for a scenario that's still being actively edited, or a "save" history full of every intermediate drag position rather than deliberate user checkpoints.

**Why it happens:**
React's data flow makes it easy to lift drag position into shared state that everything (classification, chart render, save button state) subscribes to, without distinguishing "local, high-frequency interaction state" from "committed, low-frequency application state." Global mouse listeners attached via React's synthetic event system (rather than native `document` listeners) can also compound this with unnecessary re-renders across the component tree during drag.

**How to avoid:**
Keep drag position as fast local component state (or a ref-driven imperative update path) decoupled from anything that triggers persistence. Classification recompute on every frame is usually fine (it's pure, synchronous domain logic — cheap), but persistence (tRPC mutation to save the scenario) must be explicitly and separately triggered (an explicit "Save" action or a debounced/throttled autosave with a clear trailing-edge trigger on drag end, not on every frame). Use native `document.addEventListener('mousemove'/'pointermove', ...)` for the drag gesture itself rather than React synthetic handlers scoped to the dragged element, and encapsulate the whole gesture in a reusable hook.

**Warning signs:**
- A single `onDrag` handler that both updates vessel position state and calls a tRPC mutation.
- Visible input lag or dropped frames while dragging a vessel in dev builds.
- Network tab shows a burst of requests during a single drag gesture.

**Phase to address:**
Canvas/interaction phase for the drag mechanics; API/persistence phase for defining the explicit save boundary (what "save a scenario" actually captures and when).

---

### Pitfall 10: Domain rules-engine logic coupled to tRPC routers or Prisma models

**What goes wrong:**
Given the project's stated Clean Architecture/DDD-lite ambitions and TDD focus on "business rules, domain logic," a common failure mode is writing the COLREGS classification logic directly inside tRPC procedure handlers, or shaping domain types (vessel, encounter, verdict) to match Prisma-generated types / Zod input schemas rather than the reverse. This makes the highest-value part of the codebase (the rules engine) hard to unit-test in isolation (tests need a live/mocked tRPC context or DB), hard to reuse (e.g., can't run classification in a Vitest test or a script without spinning up the API layer), and couples domain semantics to persistence/transport concerns that will inevitably drift (e.g., a Prisma schema migration nudging the shape of a domain concept for storage-efficiency reasons).

**Why it happens:**
tRPC + Prisma + Zod scaffolding tutorials overwhelmingly demonstrate CRUD-shaped, router-centric code where "the logic" lives directly in the procedure. It's also genuinely less code, short-term, to skip a domain layer and just validate-then-persist. The pull toward this pattern is strong precisely because the surrounding stack is optimized for it.

**How to avoid:**
Keep the rules engine as a standalone module with zero imports from `@prisma/client`, tRPC, or Next.js — it should be a pure TypeScript package/folder that takes plain domain objects (vessel state, positions) and returns plain verdict/reasoning objects, testable with nothing but Vitest. tRPC routers and Prisma models are adapters at the edges: routers translate HTTP-ish input (validated by Zod) into domain calls and translate domain output into API responses; Prisma models represent the persisted *scenario* (position/heading/speed/vessel-type inputs), not the *verdict* (which should generally be recomputed from stored inputs, not stored as denormalized state, to avoid drift between engine version and stored verdict).

**Warning signs:**
- Import of `@prisma/client` or `trpc` types anywhere inside files under a `domain/` or `rules/` folder.
- Classification unit tests require mocking a database or tRPC context to run.
- Zod schemas used simultaneously as both API input validation and the canonical domain type (no separate domain model).

**Phase to address:**
Foundational architecture decision for the rules-engine core phase; enforced/verified again when the API/persistence phase wires the engine up to tRPC and Prisma.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|-----------------|------------------|
| Storing the computed verdict/reasoning trail in Postgres alongside scenario inputs | Faster reads, simpler shareable-link rendering | Verdict can silently drift from what the current rules-engine version would compute (bug fixes to the engine don't retroactively fix saved scenarios) | Only if verdict is explicitly recomputed from stored inputs at read time; never treat stored verdict as source of truth |
| Hard-coded numeric thresholds (22.5°, reciprocal-heading tolerance) scattered inline in classification code | Fast to write, matches how the rule text reads | Impossible to unit-test boundary/doubt behavior systematically, hard to adjust or explain in the reasoning trail | Never — extract as named domain constants from the start given this is the highest-scrutiny part of the codebase |
| Building classification as heading-difference comparison first, relative-bearing later | Gets a demo-able "it classifies something" working fast | Silently wrong verdicts for legitimate overtaking/crossing edge cases (Pitfall 1) that require a rewrite, not a patch | Acceptable only as a literal throwaway spike to validate UI wiring — must not survive into the tested rules-engine module |
| Skipping Rule 7 (risk-of-collision) gating for MVP | Simpler domain model, fewer cases to test | Confident wrong verdicts on diverging/parallel-non-closing scenarios undermine the "correctly classify" core value | Acceptable to explicitly defer if documented as a known limitation in the reasoning trail UI ("assumes risk of collision"), not acceptable to silently omit |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|-----------------|-------------------|
| Prisma + shareable scenario links | Using sequential/incrementing IDs exposed in the shareable URL, allowing enumeration of other users' saved scenarios | Use a non-guessable identifier (UUID/cuid) as the public share slug, separate from any internal DB primary key |
| tRPC input validation (Zod) vs. domain types | Reusing the same Zod schema object as both the wire-format validator and the internal domain type, so domain logic silently depends on API-shape decisions (optional fields, string vs. number encodings) | Define Zod schemas at the API boundary only; parse into explicit domain types before calling into the rules engine |
| Next.js SSR/hydration + canvas-based chart | Rendering the interactive chart with browser-only APIs (`window`, `Canvas` context) during SSR, causing hydration mismatches on shared-link page loads | Guard canvas/drag-dependent rendering behind client-only rendering (e.g., dynamic import with SSR disabled, or mount-effect gating) for the interactive sandbox component |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|-----------------|
| Classification recompute + full chart re-render on every raw pointer-move event during drag | Visible jank/stutter while dragging a vessel, especially with reasoning-trail text re-rendering every frame | Throttle/rAF-batch position updates feeding the classification pipeline; memoize chart sub-components keyed on rounded position values | Noticeable even at small scale (single browser tab) since it's a per-frame UI responsiveness issue, not a data-scale issue |
| Re-deriving verdict from scratch inside every render of every child component that displays a piece of it | Redundant computation, harder-to-reason-about render tree | Compute verdict once per meaningful state change (e.g., in a memoized selector/hook), pass the result down as data, not recompute per consumer | Becomes visible once the reasoning trail has multiple UI consumers (chart overlay, sidebar explanation, rule citation badge) |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Predictable/sequential shareable-link IDs | Enumeration of other users' scenarios (no-auth model makes any saved scenario effectively "public if you have the link") | Non-guessable slugs (UUID v4/cuid2); treat all saved scenarios as inherently public data (no auth, so don't accept sensitive input into scenario metadata) |
| No input bounds validation on position/speed/heading before persisting | Malformed or extreme values (e.g., negative speed, heading outside 0–360, absurd coordinates) stored and later crashing the classification engine on load | Validate all vessel input at the Zod boundary with explicit ranges, independent of the domain engine's own defensive checks |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-------------------|
| Verdict/label flickers rapidly between two classifications as a vessel is dragged near a boundary angle (22.5°, reciprocal heading) | Feels buggy/untrustworthy, undermines confidence in the "correct and explainable" core value | Explicitly render the "doubt zone" as its own visual/labeled state near boundaries (ties to Pitfall 3), rather than only ever showing one of two hard classifications |
| Reasoning trail shows only the final rule number ("Rule 15 applies") without the geometric facts that produced it | Feels like an assertion, not an explanation — defeats the stated differentiator | Always pair the rule citation with the specific computed values (relative bearing, heading difference) that satisfied that rule's test, per Pitfall 8 |
| No visual indication of relative bearing sectors (the 22.5°-abaft-beam boundary, ahead/abeam zones) on the chart itself | Users can't visually verify why a classification was reached, reducing trust and educational value | Render the classic COLREGS bearing-sector diagram (sternlight/sidelight arcs) as an overlay on the vessel being evaluated, at least for preset/gallery scenarios |

## "Looks Done But Isn't" Checklist

- [ ] **Encounter classification:** Often missing the risk-of-collision (Rule 7) precondition — verify diverging/parallel-non-closing scenarios don't produce confident give-way verdicts (Pitfall 4)
- [ ] **Overtaking detection:** Often implemented via heading comparison instead of relative bearing — verify a fast vessel approaching from abaft the beam on a very different heading is still classified as overtaking (Pitfall 1, 2)
- [ ] **Rule 18 vessel-type logic:** Often modeled as a strict linear priority list — verify NUC and RAM are treated as co-equal, and that overtaking classification is checked before vessel-type hierarchy is consulted (Pitfall 5)
- [ ] **Boundary/doubt handling:** Often only tested with clean textbook angles — verify behavior exactly at 22.5°, exactly at reciprocal heading, and just inside/outside these thresholds (Pitfall 3, 7)
- [ ] **Reasoning trail:** Often shows only the verdict label — verify it surfaces the actual computed geometric values (relative bearing, closing angle) alongside the rule citation (Pitfall 8)
- [ ] **Live drag interaction:** Often wired to trigger persistence on every frame — verify saving is an explicit/debounced action, not a byproduct of every mouse-move (Pitfall 9)
- [ ] **Degenerate inputs:** Often untested — verify identical vessel positions and zero-speed vessels don't crash or silently produce `NaN`/nonsensical verdicts (Pitfall 7)
- [ ] **Rules engine isolation:** Often coupled to tRPC/Prisma — verify the classification module has zero imports from `@prisma/client` or `@trpc/*` and its tests run without a database (Pitfall 10)
- [ ] **Out-of-scope rules (Rule 19, restricted visibility, sound signals):** Often accidentally implied by UI copy or preset scenario descriptions — verify no UI text or reasoning trail references rules explicitly out of scope for this project

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|----------------|------------------|
| Heading-difference-based classification shipped instead of relative-bearing-based (Pitfall 1) | MEDIUM | Isolate and rewrite the geometry primitives module; classification rule functions that consume it should need minimal changes if they were already composed on top of a clean interface — cost is high only if the wrong primitive leaked into many call sites |
| Verdict stored denormalized and now drifting from a fixed rules-engine bug (Technical Debt row 1) | LOW–MEDIUM | Add a recompute-on-read migration/backfill; going forward, always derive verdict from stored inputs at render time |
| Domain logic tangled into tRPC routers (Pitfall 10) | HIGH | Requires extracting pure functions out of router handlers into a standalone module and rewriting tests to not depend on tRPC context — do this before the router surface grows further, as the cost only increases with more routes |
| No doubt-zone handling, verdict flickers in demo (Pitfall 3) | LOW | Add an explicit tolerance band and a third "ambiguous — doubt rule applies" classification state; low cost if the underlying geometry primitives (Pitfall 1) are already correct |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|-------------------|----------------|
| Heading-diff vs. relative-bearing confusion (1) | Rules-engine core / domain modeling | Unit tests: reciprocal-heading-but-off-axis-bearing case is NOT head-on; off-heading-but-abaft-beam case IS overtaking |
| Evaluation order / overtaking precedence (2) | Rules-engine core / domain modeling | Unit test: fast vessel astern on a very different heading still classifies as overtaking, not crossing |
| Doubt/boundary handling (3) | Rules-engine core; surfaced in explainability phase | Unit tests at exact and near-exact boundary angles (22.5°, 180°); UI test that verdict doesn't flicker across the boundary |
| Risk-of-collision gating (4) | Rules-engine core (scope decision made explicitly, not by omission) | Unit test: diverging/parallel-non-closing scenario returns "no risk of collision," not a give-way verdict |
| Rule 18 hierarchy modeling (5) | Rules-engine core, vessel-type layer | Unit tests: NUC vs. RAM produces no strict ranking; overtaking classification is not overridden by vessel type |
| Bearing/angle convention mismatch (6) | Rules-engine core (pure converters) + canvas/visualization phase (render verification) | Fixed-point unit tests (North=0°=up, East=90°=right); visual smoke test of vessel icon direction vs. stated heading |
| Degenerate geometry inputs (7) | Rules-engine core (behavior defined + tested); canvas/interaction phase (drag constraints) | Unit tests for zero-speed and identical-position inputs; manual drag test overlapping two vessels in dev build |
| Explainability designed in, not bolted on (8) | Rules-engine core (return-type design) | Code review check: classification functions return structured evaluation facts, not just a final label; reasoning-trail UI phase consumes this structure without re-deriving explanations |
| Drag-triggered over-computation/persistence (9) | Canvas/interaction phase; API/persistence phase (explicit save boundary) | Network tab shows no request burst during a drag gesture; frame-rate check during drag in dev build |
| Domain/API/persistence coupling (10) | Rules-engine core phase (module boundary set from the start); verified again in API/persistence phase | Lint/import-boundary check (no `@prisma/client` or `@trpc/*` imports in `domain/`); rules-engine test suite runs without a database |

## Sources

- [Rule 13 COLREGS Overtaking with Explanations](https://www.marinepublic.com/blogs/training/136427-rule-13-colregs-overtaking-with-explanations) — 22.5° threshold, doubt clause, sticky overtaking status
- [COLREG Rule 13 — Overtaking — IALACOLREG](https://ialacolreg.com/en/colreg/rule-13)
- [Overtaking or crossing? Don't assume what other ship will do – Professional Mariner](https://professionalmariner.com/overtaking-or-crossing-dont-assume-what-other-ship-will-do/) — real-world consequence of misclassification
- [Rule 18: not a simple "pecking order" – Professional Mariner](https://professionalmariner.com/rule-18-not-a-simple-pecking-order/) — NUC/RAM co-equal status confusion, Rule 9/10/13 override
- [COLREGs Rule 18: Vessel Hierarchy and Who Gives Way - LegalClarity](https://legalclarity.org/colregs-rule-18-vessel-hierarchy-and-who-gives-way/)
- [Col Regs – Rule 17 Stand-on vessel action / Rule 18 – The Seamanship Centre](https://seamanship.ie/col-regs-rule-18-responsibilities-between-vessels/)
- [Rule 7 COLREGS Risk of Collision with explanations](https://www.marinepublic.com/blogs/training/575092-rule-7-colregs-risk-of-collision-with-explanations) — bearing-constant/range-decreasing risk test, CPA/TCPA
- [Reliability of maritime collision avoidance systems algorithms in the implementation of COLREGs - ScienceDirect](https://www.sciencedirect.com/science/article/pii/S0951832025010403) — documented systematic implementation failures and recurring error patterns in real COLREGS software
- [COLREGs and their application in collision avoidance algorithms: A critical analysis - ScienceDirect](https://www.sciencedirect.com/science/article/pii/S0029801822013592) — encounter categories not cleanly separable, interpretation ambiguity in software implementations
- [Bearing (navigation) - Wikipedia](https://en.wikipedia.org/wiki/Bearing_(navigation)) and mathsathome.com/edspi31415.blogspot.com bearing calculators — compass-vs-math angle convention, negative-angle wraparound bug pattern
- [Common Mistakes in Developing Solutions Using Business Rules - Business Rules Journal](https://www.brcommunity.com/articles.php?id=b778) — rules embedded in process/integration layers, hidden complexity in technical rules
- [Domain Driven Backend Architecture · trpc/trpc · Discussion #1376](https://github.com/trpc/trpc/discussions/1376) — domain logic independence from tRPC/Prisma infrastructure
- [Clean Architecture in Practice with TypeScript, Prisma, Next.js - Arnaud Renaud](https://www.arnaudrenaud.com/articles/clean-architecture-typescript-prisma-next/) — moving Prisma-specific code to dedicated adapters
- [From SVG to Canvas – part 2: a new way of building interactions - Felt](https://felt.com/blog/svg-to-canvas-part-2-building-interactions) — per-element DOM/event overhead at scale
- [Dragging SVGs with React - DEV Community](https://dev.to/tvanantwerp/dragging-svgs-with-react-38h6) and [Drag events do not fire for SVG elements · Issue #3192 · facebook/react](https://github.com/facebook/react/issues/3192) — native listener requirement, synthetic event scoping issues during drag
- [Decision Table Testing Tutorial - ZetCode](https://zetcode.com/terms-testing/decision-table-testing/) and [Decision Table Based Testing - GeeksforGeeks](https://www.geeksforgeeks.org/software-engineering/decision-table-based-testing-in-software-testing/) — combinatorial coverage approach for rule-based systems

---
*Pitfalls research for: Maritime COLREGS rules-engine visualizer (COLREGS Navigator)*
*Researched: 2026-07-14*
