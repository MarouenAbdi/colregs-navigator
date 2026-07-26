# Phase 19: Guided Tour - Context

**Gathered:** 2026-07-26
**Status:** Ready for planning

<domain>
## Phase Boundary

A first-time or confused user can open a self-contained, 6-step modal walkthrough (triggered by a new "How to read this" button in Sandbox's existing top header row) that explains how to read the Sandbox — vessel drag/rotate, the instrument footer, the header verdict/badges, the reasoning chain, and the Gallery — fully operable by mouse, keyboard (Back/Next/Escape), and screen-reader-relevant focus handling (focus trap while open, focus returns to the trigger button on close). This phase does not touch Sandbox's chart/overlay/strip components themselves (those are Phase 18, already shipped) or the reasoning trail's visual restructure (Phase 20). No `classifyEncounter()`/domain logic change — presentation layer only, same boundary as the rest of v1.4. Auto-launch-on-first-visit (TOUR-03) is explicitly out of scope for this phase — already deferred to v2 at v1.4 requirements scoping.

</domain>

<decisions>
## Implementation Decisions

All decisions below were captured by reading the actual current design source (`COLREGS Navigator (shadcn).dc.html`, fetched live via `DesignSync` from the `claude.ai/design` project referenced in `PROJECT.md`) — the design source contains a fully coded, working tour prototype, not just a static mockup. See `19-DESIGN-SNAPSHOT.md` for the full extracted markup, step content, and illustrations each decision below references.

### Modal implementation mechanism
- **D-01:** Implement the tour modal using shadcn's `Dialog` primitive (`npx shadcn add dialog` — zero new dependency, `radix-ui@^1.6.2` is already installed; no `dialog.tsx` exists yet in `src/components/ui/`), not a hand-rolled `position:fixed` overlay div copying the design source's bespoke markup. **Rationale, and a real gap this resolves:** the design source's own tour prototype code wires only `onTourSkip`/`onTourNext`/`onTourBack` to explicit buttons — its fixed overlay div has **no outside-click handler** and there is **no Escape-key handler anywhere in its tour JS**. ROADMAP's locked success criteria 3 ("dismiss via Escape, clicking outside the modal, or Skip/Done") and 4 (focus returns to trigger button) are therefore **not actually present in the design's own prototype** — this is the same category of gap as Phase 18's D-01 (design's real coded behavior falling short of a locked ROADMAP criterion). Radix's Dialog defaults (`modal={true}`, Escape-to-close, `onPointerDownOutside`/`onInteractOutside`, focus-trap, `onCloseAutoFocus` returning focus to the trigger) close this gap for free instead of requiring hand-built focus-trap/outside-click/Escape logic — directly following `PITFALLS.md`'s Pitfall 4 recommendation.

### Final-step button label
- **D-02:** Ship the design source's exact copy: the forward button reads **"Next"** on steps 1–5 and **"Start exploring"** on step 6 (not literally "Done"). The underlying *behavior* matches ROADMAP's criterion 2 exactly either way — the same forward button that advances steps 1–5 closes the tour on step 6 (`tourNext()`'s own logic: `if (tourStep >= length-1) closeTour()`) — only the literal button text differs from ROADMAP's descriptive wording ("Done" replaces "Next"). The milestone's locked decision is to match the design exactly, and the user confirmed the verbatim design copy over ROADMAP's paraphrase.

### Tour step illustrations
- **D-03:** Port the design source's 6 per-step inline SVG illustrations verbatim (radar scope, hull drag/rotate diagram, instrument tiles, verdict/badge rows, decision-chain nodes, gallery thumbnail grid — full markup in `19-DESIGN-SNAPSHOT.md`) into a new `TourStepIllustration.tsx` component switched by step id, per `ARCHITECTURE.md`'s recommended structure. No new illustration design work — matches "match design exactly."

### Z-index handling
- **D-04:** Establish an explicit, documented z-index scale/convention (not an ad hoc one-off value) covering the Tour's stacking tier relative to Phase 18's on-chart `VesselControlOverlay` and any other overlay/banner in the app. Directly follows `PITFALLS.md`'s Pitfall 4 warning that two new stacking features landing in the same milestone (Tour portal + Phase 18's overlay cards) risks an undocumented collision if either gets a casually-chosen large z-index. Concrete mechanism (a shared constants module vs. a documented CSS custom-property scale vs. a code comment establishing the tiers) is Claude's discretion at planning/implementation time — the requirement locked here is that it must be a *documented, shared* scale, not a private number chosen in isolation for this phase only.

### Claude's Discretion
- Exact mechanism for documenting the z-index scale (D-04) — shared constants module, CSS custom properties, or a documented comment convention; whichever fits this codebase's existing conventions best.
- Whether `TourStepIllustration.tsx` renders each step's SVG via `dangerouslySetInnerHTML` (closest to the design source's own templating) or as translated inline JSX (`class`→`className`, etc.) — behavior/visual output must be identical either way; pick whichever fits this codebase's existing SVG-in-JSX conventions (`VesselGroup.tsx` et al. use plain JSX, not `dangerouslySetInnerHTML` — likely the better fit, but not locked).
- Whether the `guided-tour-steps.ts` data module's `points` field is typed as a fixed 2–3-tuple or a general array — content is fixed at 2 or 3 points per step in the design source, but the exact TypeScript shape is an implementation detail.
- Precise Tailwind/shadcn translation of the design source's inline-style modal card (border/shadow/backdrop-blur treatment, 600px max-width, 820px max-height) — port the *behavior and visual result* using this codebase's existing token/utility conventions, not the design's raw hex/px literals verbatim (same porting convention Phase 18 used for its overlay card).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design source (primary reference for this phase)
- `.planning/phases/19-guided-tour/19-DESIGN-SNAPSHOT.md` — **read this first.** Local extract of the trigger button, modal structure, all 6 tour steps' copy, footer controls, and all 6 per-step illustration SVGs verbatim from the live `claude.ai/design` file, with the Escape/outside-click gap and button-label divergence called out explicitly.
- Live source (only if the snapshot is suspected stale): `claude.ai/design` project `c265c047-81a0-4446-bdf3-95d434adc3dc` ("COLREGS Navigator design brief"), file `COLREGS Navigator (shadcn).dc.html`, accessible via the `DesignSync` tool (`get_file`). Also contains `screenshots/01-tour-viz.png` through `03-tour-viz.png` if visual cross-checking is needed.

### Research (produced ahead of this milestone's phases)
- `.planning/research/ARCHITECTURE.md` — Component Responsibilities table (`GuidedTourModal`, `guided-tour-steps.ts`, `TourStepIllustration`), Recommended Project Structure (`src/components/tour/` as its own top-level feature folder, not nested under `sandbox/` — rationale: the tour's content has no dependency on Sandbox's state/types), Anti-Pattern 2 (do NOT lift `isTourOpen` into `useSandboxState()` — it's ephemeral view state with zero effect on classification, belongs as local `useState`), Suggested Build Order step [4] (Guided Tour is fully independent of Phase 17/18's files).
- `.planning/research/PITFALLS.md` — Pitfall 4 (full analysis of the Dialog-on-top-of-an-already-overlay-heavy-page risk: z-index/stacking-context collisions, focus-return-to-trigger conflicts; recommends shadcn/Radix Dialog specifically and a documented z-index scale; the human-verification checklist item it proposes: "open Tour from the button, confirm background Sandbox drag/overlay interactions are fully inert while Tour is open (not just visually dimmed), close Tour via Escape AND via a close button AND via outside-click, confirm focus lands back on the 'How to read this' button each time"), the Known-Gaps table entry "Guided Tour: Often missing verified focus-trap behavior."

### Roadmap & requirements
- `.planning/ROADMAP.md` — Phase 19 section (Goal, Depends on Phase 18, Requirements: TOUR-01/TOUR-02, Success Criteria 1-5 — criterion 3/4 are the source of D-01's Dialog-primitive choice; criterion 5 is the source of D-04's z-index requirement).
- `.planning/REQUIREMENTS.md` — TOUR-01, TOUR-02. Also confirms TOUR-03 (auto-launch on first visit) is deferred to v2 — not in scope here.
- `.planning/PROJECT.md` — v1.4 milestone goal ("re-sync front end against the updated Claude Design file... Net-new Guided Tour: 6-step modal walkthrough") and "zero change to `classifyEncounter()`/domain logic — presentation layer only" constraint.

### Prior phases
- `.planning/phases/18-on-chart-vessel-control-overlay/18-CONTEXT.md` — precedent for how this project resolves design-source-vs-ROADMAP conflicts (D-01 there: present the specific conflict to the user, get an explicit call, don't silently pick one — same pattern followed here for D-01/D-02). Also the source of the `VesselControlOverlay`'s own z-index/stacking behavior, directly relevant to D-04's shared scale.
- `.planning/phases/16-sandbox-mutation-path-generalization/16-CONTEXT.md` — confirms the "every mutation source funnels through one choke point" invariant; not directly touched by this phase (the Tour has zero interaction with `useSandboxState()`), but relevant context for why `isTourOpen` must NOT be added to that hook (Anti-Pattern 2).

### Existing code this phase must reuse, not reinvent
- `src/components/sandbox/SandboxContainer.tsx` — the existing top header row (currently Reset + Save/CopyLink buttons) is where the new "How to read this" button is added, per the design source's own placement.
- `src/components/ui/button.tsx` — existing `Button` component/variants for the trigger button and the modal's Back/Next/Skip buttons (outline/ghost/primary variants already exist; no new button variant needed based on the design source's 3 button treatments).
- `components.json` — confirms `radix-ui` is aliased under this project's shadcn setup (`"style": "radix-nova"`, single `radix-ui` package import, not per-primitive `@radix-ui/react-*` packages) — `npx shadcn add dialog` should follow the same existing import convention already used by `button.tsx`/`select.tsx`/`slider.tsx`.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/ui/button.tsx` — Button variants (default/outline/ghost) cover the trigger button, Back, Next/"Start exploring", and Skip — no new button primitive needed.
- Existing radar-sweep-dot visual (small spinning conic-gradient circle) already used elsewhere in the design's header chrome — same treatment reused for the tour trigger button and modal header's "GUIDED TOUR · STEP n/6" label.

### Established Patterns
- "Ephemeral view state stays local, not in `useSandboxState()`" (ARCHITECTURE.md Anti-Pattern 2, same pattern Phase 18 used for `selectedVessel`) — `isTourOpen`/`tourStep` are local `useState` in `SandboxContainer` (or a thin dedicated hook), never lifted into the shared state hook.
- "Split computation/data from presentation" (this project's established convention, restated in ARCHITECTURE.md's Structure Rationale) — `guided-tour-steps.ts` stays a pure data module (no JSX, no domain imports, same shape convention as the removed `chip-scenarios.ts`), with `TourStepIllustration.tsx` as the separate presentation piece that switches on step id.
- Design-source-vs-ROADMAP conflict resolution pattern (Phase 18 precedent) — when the two disagree, surface the specific conflict and let the user make an explicit call rather than silently choosing one (applied here for D-01 and D-02).

### Integration Points
- `SandboxContainer.tsx` — gains the "How to read this" trigger button in its existing top header row, and composes the new `GuidedTourModal` (or equivalent Dialog-based component) as a sibling, driven by new local open/step state.
- `src/components/ui/` — gains `dialog.tsx` (via `npx shadcn add dialog`), the first modal primitive in this codebase.
- New `src/components/tour/` top-level folder (per ARCHITECTURE.md's Structure Rationale — the tour's static content has no dependency on Sandbox's state/types, so it does not belong nested under `sandbox/`): `GuidedTourModal.tsx`, `guided-tour-steps.ts`, `TourStepIllustration.tsx`.

</code_context>

<specifics>
## Specific Ideas

The primary "specific idea" for this phase is the design source's fully-coded tour prototype itself — captured in full in `19-DESIGN-SNAPSHOT.md`, not paraphrased from memory. Where the design source's actual coded behavior fell short of ROADMAP's locked criteria (Escape/outside-click dismissal, D-01) or diverged from ROADMAP's descriptive wording (final-step button label, D-02), the user was shown the specific gap/conflict and made an explicit call rather than either being silently overridden.

</specifics>

<deferred>
## Deferred Ideas

None new — discussion stayed within phase scope. TOUR-03 (auto-launch tour on first visit) was already deferred to v2 at v1.4 requirements scoping (see `.planning/PROJECT.md` Deferred Items / `.planning/STATE.md`), not re-litigated here.

### Reviewed Todos (not folded)
None — `gsd-sdk query todo.match-phase 19` returned zero matches.

</deferred>

---

*Phase: 19-Guided Tour*
*Context gathered: 2026-07-26*
