# Architecture Research

**Domain:** v1.4 Design Sync integration — restructuring an existing Next.js 16 App Router / React 19 / tRPC front end (COLREGS Navigator Sandbox + Gallery), presentation-layer only, zero domain/`src/server/` changes
**Researched:** 2026-07-25
**Confidence:** HIGH — based on direct inspection of the actual current implementation (`useSandboxState.ts`, `SandboxContainer.tsx`, `ChartPanel.tsx`, `VesselGroup.tsx`, `ControlPanel.tsx`, `VerdictBanner.tsx`, `InstrumentReadouts.tsx`, `GalleryContainer.tsx`, `GalleryCard.tsx`, `app/page.tsx`, `chip-scenarios.ts`), not inferred from training data. The Next.js Server/Client Component composition pattern used below (Server Components as `children` of a Client Component) is a documented, stable React Server Components capability, not new/uncertain API surface.

## Standard Architecture

### System Overview — current (pre-v1.4)

```
app/page.tsx (Server Component)
├── <Hero/>                                     (mostly static, illustrative-only)
├── <section id="sandbox">
│     └── <SandboxContainer/>  "use client"      ← single React tree, client-only
│           ├── useSandboxState()                ← THE state choke point
│           │     vesselA/vesselB, lastGoodClassification,
│           │     isDegenerate, activeChipId, saveError, isSaving
│           │     applyVesselUpdate() (private) ← every mutation funnels here
│           │     handleChipSelect(chipId) ← full-replace + hysteresis reset
│           │     handleReset(), handleSave()
│           ├── chip row (6 preset buttons)      ← REMOVED this milestone
│           ├── <VerdictBanner/>                 ← full-width, own row
│           ├── grid: <ChartPanel/> | <InstrumentReadouts/> + <ControlPanel/>
│           └── <ReasoningTrail/>                ← horizontal card row already
└── <section id="gallery">
      └── <GalleryContainer/> (async Server Component, tRPC gallery.list)
            └── <GalleryCard/> × N  (whole card = <Link href="/s/{id}">)
```

### System Overview — target (v1.4)

```
app/page.tsx (Server Component, unchanged Server/async boundary for Gallery)
└── <SandboxBridgeProvider>  "use client"        ← NEW, thin, page-level
      (children below are still composed IN page.tsx — Server Components
       passed as `children` into a Client Component do not themselves
       become Client Components; only the Provider itself needs "use client")
      ├── <Hero/>                                 (untouched, visual sync only)
      ├── <section id="sandbox">
      │     └── <SandboxContainer/>  "use client"
      │           ├── useSandboxState()           ← loadScenario() replaces
      │           │                                  handleChipSelect(); chip
      │           │                                  row + activeChipId REMOVED
      │           ├── useSandboxBridge() effect   ← NEW: consumes pending
      │           │                                  scenario from context
      │           ├── top header (title/desc + Save/Reset + NEW "How to
      │           │     read this" button opening <GuidedTourModal/>)
      │           ├── <ChartHeaderStrip/>          ← NEW, replaces VerdictBanner
      │           │     (verdict + rule badge + role badges + risk pill,
      │           │      merged from VerdictBanner + InstrumentReadouts' pill)
      │           ├── <ChartPanel/>                ← MODIFIED: now also owns
      │           │     vessel-selection state + renders
      │           │     <VesselControlOverlay/> on click
      │           ├── <ChartFooterStrip/>          ← NEW, replaces
      │           │     InstrumentReadouts (tiles minus pill) + adds
      │           │     per-vessel required-action text
      │           └── <ReasoningTrail/>            ← same file, connector-line
      │                 visual treatment only, no boundary change
      └── <section id="gallery">
            └── <GalleryContainer/> (async Server Component, UNCHANGED fetch)
                  └── <GalleryCard/> × N  (Server Component, no "use client")
                        └── <TryOnSandboxButton/>  "use client" ← NEW, only
                              the interactive leaf; calls useSandboxBridge()
                              .requestLoad(vesselA, vesselB) + scrollIntoView
```

**Deleted:** `src/components/sandbox/control-panel/ControlPanel.tsx` (and its
test), the inline chip row JSX in `SandboxContainer.tsx`, `activeChipId`/
`handleChipSelect` from `useSandboxState.ts`, `GalleryCard.tsx`'s whole-card
`<Link>`. `CopyLinkButton.tsx` (used only by `/s/[shareId]/page.tsx`, unrelated
to vessel controls) survives — relocate it out of `control-panel/` once that
folder is otherwise empty.

### Component Responsibilities

| Component | Responsibility | New / Modified / Deleted |
|-----------|----------------|---------------------------|
| `useSandboxState()` | Still the single state choke point for `vesselA`/`vesselB`, classification, hysteresis. Gains a generalized `loadScenario(vesselA, vesselB)` (same body as today's `handleChipSelect`, minus the chip-ID lookup). Loses `activeChipId`/`handleChipSelect`. | Modified |
| `SandboxBridgeProvider` + `useSandboxBridge()` | Page-scoped React Context carrying one thing: "a scenario is pending load" (`{vesselA, vesselB, requestId}` or `null`) plus a `requestLoad()` setter. Zero business logic — a pure signaling channel between two sibling client trees separated by a Server Component in between. | New |
| `TryOnSandboxButton` | The only interactive element left in a Gallery card. Calls `requestLoad()` then does `document.getElementById("sandbox")?.scrollIntoView(...)` directly — scrolling does not need to wait on Sandbox's own re-render, so it is not routed through the bridge. | New |
| `ChartHeaderStrip` | Merges `VerdictBanner`'s rule badge / title / description / role badges with the risk status pill currently rendered inside `InstrumentReadouts`. Reuses `bannerAccentClassName`/`bannerRuleBadge`/`verdictBannerDescription` (from `VerdictBanner.tsx`) and `statusPillCopy` (from `instrument-readouts`/`status-pill.ts`) as pure derivation imports — no duplicated logic. | New (replaces `VerdictBanner.tsx`) |
| `ChartFooterStrip` | Renders the Range/Bearing/CPA/TCPA tile grid (from `InstrumentReadouts`, minus the pill) plus new per-vessel required-action sentences, derived from `getVesselRole()` via a new small pure module. | New (replaces `InstrumentReadouts.tsx`) |
| `ChartPanel` | Unchanged SVG surface + drag/rotate. Gains ephemeral `selectedVessel: VesselLabel \| null` local state (NOT lifted into `useSandboxState()` — it has zero effect on classification) and renders `VesselControlOverlay` for whichever vessel is selected. | Modified |
| `VesselControlOverlay` | Floating HTML card (shadcn `Select`/`Slider`, same fields as the old `ControlPanel`'s `VesselFormSection`) absolutely positioned over the chart using the already-computed `screenA`/`screenB` pixel coordinates from `chart-panel-derivation.ts`. Opens on hull click, closes on outside-click/Escape/selecting the other vessel. | New (absorbs `ControlPanel.tsx`'s form-field JSX) |
| `GuidedTourModal` | 6-step modal, shadcn `Dialog` (not yet added to `src/components/ui/` — needs `npx shadcn add dialog`, backed by the already-installed `radix-ui` package). Reads step content from a pure data module. | New |
| `guided-tour-steps.ts` | Pure data: `{id, title, body, bullets}[]`, no JSX, no domain imports — same shape convention as `chip-scenarios.ts`. | New |
| `TourStepIllustration` | Per-step decorative inline SVG, switched by step id — kept OUT of the data module per this repo's "split computation/data from presentation" convention. | New |
| `GalleryCard` | Drops the whole-card `<Link>`; becomes a plain (non-"use client") `Card` with a hover-revealed `TryOnSandboxButton` child. | Modified |

## Recommended Project Structure

```
src/components/
├── sandbox/
│   ├── SandboxContainer.tsx          # MODIFIED: no chip row, composes strips
│   ├── hooks/
│   │   └── useSandboxState.ts        # MODIFIED: loadScenario() replaces
│   │                                  #   handleChipSelect(); activeChipId gone
│   ├── chip-scenarios.ts             # DELETE if no other consumer remains
│   │                                  #   after the chip row is removed
│   ├── bridge/
│   │   └── SandboxBridgeProvider.tsx # NEW: context + useSandboxBridge()
│   ├── chart/
│   │   ├── ChartPanel.tsx            # MODIFIED: + selectedVessel state
│   │   ├── ChartHeaderStrip.tsx      # NEW (replaces reasoning/VerdictBanner.tsx)
│   │   ├── ChartFooterStrip.tsx      # NEW (replaces instruments/InstrumentReadouts.tsx)
│   │   ├── chart-footer-action-text.ts # NEW: pure VesselRole -> action sentence
│   │   ├── VesselControlOverlay.tsx  # NEW (absorbs control-panel/ControlPanel.tsx)
│   │   ├── VesselGroup.tsx           # UNCHANGED shape, but see Pitfall note below
│   │   │                              #   re: adding a click handler here
│   │   ├── chart-panel-derivation.ts # UNCHANGED — already exposes screenA/screenB
│   │   └── chart-panel-geometry.ts   # UNCHANGED
│   ├── reasoning/
│   │   └── ReasoningTrail.tsx        # MODIFIED (visual connector treatment only)
│   └── control-panel/
│       └── CopyLinkButton.tsx        # MOVED here from a deleted ControlPanel.tsx
│                                      #   sibling — relocate to sandbox/ root once
│                                      #   control-panel/ has only this one file left
├── gallery/
│   └── card/
│       ├── GalleryCard.tsx           # MODIFIED: no <Link>, renders TryOnSandboxButton
│       └── TryOnSandboxButton.tsx    # NEW, "use client"
└── tour/
    ├── GuidedTourModal.tsx           # NEW
    ├── guided-tour-steps.ts          # NEW, pure data
    └── TourStepIllustration.tsx      # NEW
```

### Structure Rationale

- **`sandbox/bridge/`, not `shared/`:** the bridge has exactly two real consumers (`SandboxContainer` and `GalleryCard`'s button), both of which exist today, so per this repo's own "extract to `shared/` only on a real second consumer" convention it does *not* belong in `src/components/shared/` — it's a Sandbox-owned concern that Gallery imports, not a generic cross-feature primitive. If a third consumer appears later (e.g. Hero's CTA also loading a scenario), promote it then, not now.
- **`tour/` as its own top-level feature folder, not nested under `sandbox/`:** the Guided Tour is triggered from Sandbox's header, but its content (6-step maritime-encounter explainer) has no dependency on Sandbox's state or types — keeping it a standalone folder avoids coupling a self-contained, static-content feature to Sandbox's file tree the way `chip-scenarios.ts` (Vessel literals, Sandbox-specific) legitimately is coupled to it.
- **`ChartHeaderStrip`/`ChartFooterStrip` inside `sandbox/chart/`, not `sandbox/reasoning/`/`sandbox/instruments/`:** both strips are now visually and functionally part of the chart panel's own card (header/footer of the *chart*, not a separate reasoning aside), so relocating them next to `ChartPanel.tsx` reflects the real new composition, not the old one.
- **`chart-footer-action-text.ts` as a new pure module, not inline in the strip component:** matches this repo's established split (`instrument-readouts.ts`, `status-pill.ts`, `vessel-role.ts` are all pure, framework-free derivation modules imported by presentation components) — the required-action sentence is a pure `VesselRole -> string` mapping with zero JSX, independently unit-testable the same way `status-pill.test.ts` already tests `statusPillCopy()`.

## Architectural Patterns

### Pattern 1: Generalize the existing "full replace + hysteresis reset" choke point instead of adding a parallel one

**What:** `handleChipSelect(chipId)` in `useSandboxState.ts` already does exactly what "Try on Sandbox" needs — reset `previousEncounterTypeRef`, then call `applyVesselUpdate(nextA, nextB)`. Rename/generalize it to `loadScenario(vesselA: Vessel, vesselB: Vessel)`, drop the `ChipId` lookup, and have both the (now-removed) chip row's old call sites and the new bridge-driven load path call the same function.

**When to use:** Now — it is a small, mechanical refactor that both unblocks the Gallery→Sandbox wiring and satisfies the "remove chip row" target feature in one pass, and it means the codebase never has two independently-written "replace both vessels and reset hysteresis" code paths.

**Trade-offs:** None significant. This is strictly a rename + signature generalization of code that already exists and is already tested via `SandboxContainer.test.tsx`.

**Example:**
```typescript
// useSandboxState.ts
function loadScenario(nextA: Vessel, nextB: Vessel): void {
  previousEncounterTypeRef.current = undefined;
  applyVesselUpdate(nextA, nextB);
}
```

### Pattern 2: Server Components as `children` of a page-level Client Provider

**What:** `SandboxBridgeProvider` is a `"use client"` component whose only job is to hold `pendingScenario` state and expose `requestLoad()`. It wraps `{children}` — but those children (`<Hero/>`, `<SandboxContainer/>`, `<GalleryContainer/>`) are still *composed inside `app/page.tsx`*, which remains an ordinary Server Component. React Server Components support passing Server Component output through a Client Component's `children` slot without forcing those children to become Client Components themselves — only the Provider crosses the boundary, `GalleryContainer`'s async tRPC fetch is completely unaffected.

**When to use:** Exactly this shape — a small, well-known set of sibling consumers (here: 2) on the same page that sit on opposite sides of a Server/Client boundary and need to signal one direction (Gallery → Sandbox). This is the standard, documented Next.js App Router answer to "a Server-rendered button needs to affect client state elsewhere on the page" — it does not require lifting Gallery's data-fetching into a client component, and does not require a new dependency (Zustand, event bus, etc.).

**Trade-offs:** A plain `createContext`/`useState` round-trip means Sandbox's `useEffect` fires one render *after* the button click, not synchronously — acceptable here since nothing in the UI needs the load to be perceptibly instantaneous, and it's the same one-tick lag `router.push()`-driven navigation already has elsewhere in this app. Rejected alternative: a `window.dispatchEvent(new CustomEvent(...))` / `window.addEventListener` pair. It would also work and needs no Provider wrapper at all, but it is strictly *less* traceable/typed than Context (a reviewer has to grep for a string event name rather than a typed hook), which cuts against this codebase's explicit "explicit dependencies" constraint — Context is the more idiomatic, equally-lightweight choice here.

**Example:**
```typescript
// src/components/sandbox/bridge/SandboxBridgeProvider.tsx
"use client";
type PendingScenario = { vesselA: Vessel; vesselB: Vessel; requestId: number };
const SandboxBridgeContext = createContext<{
  pendingScenario: PendingScenario | null;
  requestLoad: (vesselA: Vessel, vesselB: Vessel) => void;
} | null>(null);

export function SandboxBridgeProvider({ children }: { children: ReactNode }) {
  const [pendingScenario, setPendingScenario] = useState<PendingScenario | null>(null);
  const requestLoad = useCallback((vesselA: Vessel, vesselB: Vessel) => {
    // requestId (not vessel identity) is the effect dependency below, so
    // re-selecting the SAME gallery scenario twice in a row still reloads it.
    setPendingScenario({ vesselA, vesselB, requestId: Date.now() });
  }, []);
  return (
    <SandboxBridgeContext.Provider value={{ pendingScenario, requestLoad }}>
      {children}
    </SandboxBridgeContext.Provider>
  );
}

export function useSandboxBridge() {
  const ctx = useContext(SandboxBridgeContext);
  if (!ctx) throw new Error("useSandboxBridge must be used within SandboxBridgeProvider");
  return ctx;
}
```
```typescript
// inside SandboxContainer.tsx (or a small effect in useSandboxState.ts)
const { pendingScenario } = useSandboxBridge();
useEffect(() => {
  if (!pendingScenario) return;
  sandboxState.loadScenario(pendingScenario.vesselA, pendingScenario.vesselB);
  // deliberately keyed on requestId, not on vesselA/vesselB object identity
}, [pendingScenario?.requestId]);
```
```tsx
// TryOnSandboxButton.tsx
"use client";
export function TryOnSandboxButton({ vesselA, vesselB }: { vesselA: Vessel; vesselB: Vessel }) {
  const { requestLoad } = useSandboxBridge();
  return (
    <button
      type="button"
      onClick={() => {
        requestLoad(vesselA, vesselB);
        document.getElementById("sandbox")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }}
    >
      Try on Sandbox
    </button>
  );
}
```

### Pattern 3: Ephemeral UI-selection state stays local to the component that owns the interaction, not in `useSandboxState()`

**What:** `selectedVessel` (which vessel's on-chart overlay, if any, is open) and the Guided Tour's open/closed flag are pure view state with zero effect on classification. They belong as local `useState` in `ChartPanel`/`SandboxContainer` respectively — not lifted into `useSandboxState()`, which this codebase has deliberately scoped to "vessel data + derived classification" only (see its own file header comment).

**When to use:** Always, for this kind of state — it is the same boundary this codebase already draws between `useSandboxState()` (domain-adjacent) and `useContainerSize()`/`useHullDrag()`/`useRotateHandleDrag()` (chart-interaction-local hooks that ChartPanel owns directly).

**Trade-offs:** None — this is a continuation of an already-established, working pattern, not a new decision.

## Data Flow

### Vessel-state mutation flow (unchanged shape, one new entry point)

```
Drag/rotate gesture (ChartPanel) ──┐
Form field (VesselControlOverlay) ─┼─→ useSandboxState()'s applyVesselUpdate()
Reset button ───────────────────────┤     (validate via VesselSchema, then
loadScenario() [Gallery bridge] ────┘      classifyEncounter(), Rule 13(d)
                                            hysteresis via previousEncounterTypeRef)
                                                    │
                                                    ▼
                              { vesselA, vesselB, lastGoodClassification,
                                isDegenerate } ── re-render ──▶
                              ChartHeaderStrip / ChartPanel / ChartFooterStrip /
                              VesselControlOverlay / ReasoningTrail
```

### Gallery → Sandbox cross-tree flow (new)

```
User hovers GalleryCard → TryOnSandboxButton revealed (pure CSS, Server-rendered)
User clicks button (client leaf)
    → SandboxBridgeProvider.requestLoad(vesselA, vesselB)   [Context setState]
    → document.getElementById("sandbox").scrollIntoView(...)  [immediate, no wait]
        (independent of the Context round-trip — the anchor exists regardless
         of whether Sandbox has re-rendered with the new scenario yet)
                              ↓ (next render tick)
SandboxContainer's effect sees pendingScenario.requestId change
    → sandboxState.loadScenario(vesselA, vesselB)
    → same applyVesselUpdate() path as every other mutation source above
```

### Key Data Flows

1. **Single choke point preserved:** every one of drag, rotate, on-chart overlay form field, Reset, and now Gallery-driven load funnels through the same `applyVesselUpdate()` — the v1.4 restructure adds call sites, it does not add a second mutation path. This is the most important invariant to preserve: a bug class this project has already paid for twice (`VesselGroup.tsx`'s hit-testing regressions) came from two logically-identical things drifting into two separately-maintained implementations.
2. **UI-selection state flows one level, not through the state hook:** `ChartPanel` owns `selectedVessel`, passes the selected vessel's data + the two `onVesselSpeedChange`/`onVesselTypeChange` handlers (already available in `useSandboxState()`'s return value, just not previously threaded into `ChartPanel`) down into `VesselControlOverlay`. `ChartPanelProps` must be extended to accept these two handlers, which today only reach `ControlPanel` directly from `SandboxContainer`.
3. **Gallery's data fetch is untouched:** `GalleryContainer`'s `await getCaller().gallery.list()` and `rowToVessels()` still run exactly as today, server-side, at request time — nothing about the bridge changes how or when that data is fetched, only what happens when a user acts on it.

## Anti-Patterns

### Anti-Pattern 1: Wiring the hull's click-to-select overlay through the same pointer handlers as drag, with no movement threshold

**What people do:** Add a plain `onClick` to the hull `<polygon>` alongside its existing `onPointerDown`/`onPointerMove`/`onPointerUp` drag handlers, assuming "click" only fires on a true stationary click.

**Why it's wrong:** This is the exact bug class this project has already hit twice (documented in `PROJECT.md`'s Key Decisions: the Phase 4 and Phase 8 hit-testing regressions), from a different angle — a `click` event fires after `pointerdown`→`pointerup` on the same element in most browsers *regardless of how far the pointer moved in between* (no built-in drag-distance threshold). Without an explicit guard, ending a hull-drag gesture would also toggle the vessel-control overlay open/closed on every single drag, which reads as broken, flickering UI.

**Instead:** Track the `clientX`/`clientY` at `onPointerDown` in a ref, and in `onPointerUp` compare against the up-position; only treat it as a "select" if the total movement is under a small pixel threshold (e.g. 4-5px). This logic belongs in a small addition to `useHullDrag.ts` (or a sibling hook) — not duplicated per-vessel, and not left as a bare `onClick`.

### Anti-Pattern 2: Lifting `selectedVessel`/Guided-Tour-open state into `useSandboxState()`

**What people do:** Add `selectedVessel`/`isTourOpen` fields and setters to the same hook that owns `vesselA`/`vesselB`/classification, on the reasoning that "it's all Sandbox state."

**Why it's wrong:** `useSandboxState()`'s own file header explicitly scopes it to vessel data + the validate-then-classify choke point; mixing in view-only UI state that never touches `classifyEncounter()` blurs that boundary for no benefit, and makes the hook's return type grow with every future UI-only interaction this Sandbox ever gains.

**Instead:** Keep it local (Pattern 3 above) — exactly where `useContainerSize()`/drag hooks already live relative to `ChartPanel`.

### Anti-Pattern 3: Making `GalleryContainer` or `GalleryCard` a Client Component to support the new button

**What people do:** Add `"use client"` to the top of `GalleryCard.tsx` (or worse, `GalleryContainer.tsx`) because "the button needs interactivity."

**Why it's wrong:** `GalleryContainer` is an `async` Server Component performing the real tRPC data fetch (`gallery.list()`) at render time — making it (or its child `GalleryCard`) a Client Component would force that fetch to move client-side (a new tRPC client call, a loading state, a waterfall) for zero benefit, since only the button's `onClick` needs a client boundary.

**Instead:** Push `"use client"` down to the smallest possible leaf — `TryOnSandboxButton` only. `GalleryCard` stays a plain Server Component that simply renders that client child, which is a fully supported, ordinary composition (Server Components may freely import and render Client Components; only the reverse is restricted).

### Anti-Pattern 4: Reaching for Zustand (or any new state-management dependency) for the Gallery↔Sandbox bridge

**What people do:** Since two independent trees need to share a signal, treat it as validation that "we finally need global state" and add a store library.

**Why it's wrong:** This project's own `STACK.md`/CLAUDE.md conventions gate `zustand` behind "3+ sibling panels genuinely needing shared state" — there are exactly 2 consumers here (one Gallery button type, one Sandbox), and React's built-in Context is sufficient and already idiomatic for the App Router Server/Client boundary this problem actually is.

**Instead:** Plain `createContext`/`useState` (Pattern 2). Revisit only if a third independent consumer of "load a scenario into the sandbox" appears (e.g., a future shareable-deeplink-triggered load, though that already has its own mechanism via `/s/[shareId]`'s `initialScenario` prop).

## Integration Points

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `GalleryCard` (Server) ↔ `TryOnSandboxButton` (Client) | Plain props (`vesselA`, `vesselB`, `title` for the `aria-label`) — a Server Component rendering a Client Component and passing serializable props is standard RSC composition, no special handling needed | `vesselA`/`vesselB` are plain data objects (Zod-inferred `Vessel`), already serializable |
| `TryOnSandboxButton`/`SandboxContainer` ↔ `SandboxBridgeProvider` | React Context, one direction of intent (`requestLoad`) + one piece of state (`pendingScenario`) | No business logic in the Provider — it is purely a signaling channel; all validation/classification still happens inside `useSandboxState()`'s `applyVesselUpdate()` |
| `ChartPanel` ↔ `VesselControlOverlay` | Props: selected vessel's data, its role, and the two handlers already present in `useSandboxState()`'s return value | Requires extending `ChartPanelProps` (`types.ts`) to add `onVesselSpeedChange`/`onVesselTypeChange`, mirroring the shape `ControlPanelProps` already has today |
| `ChartHeaderStrip`/`ChartFooterStrip` ↔ pure derivation modules | Direct function imports (`bannerRuleBadge`, `verdictBannerDescription`, `statusPillCopy`, `deriveInstrumentReadouts`, new `chart-footer-action-text.ts`) | No new coupling shape — these strips consume the same pure functions the components they replace already consumed; only the JSX composition/layout changes |
| `SandboxContainer`'s "How to read this" button ↔ `GuidedTourModal` | Local `useState<boolean>` (open/closed), same file or a thin wrapper — no Context needed since it's a single producer/single consumer within one tree | Add shadcn's `Dialog` primitive (`npx shadcn add dialog`) — `radix-ui@^1.6.2` is already an installed dependency, so this is a zero-new-dependency addition, just an unadded `src/components/ui/dialog.tsx` file |

## Suggested Build Order

Given the milestone context's explicit callout — "Gallery→Sandbox wiring is a hard dependency for the 'Try on Sandbox' button but independent of the Guided Tour and the header/footer-strip restructure" — the dependency graph is:

```
[1] Prerequisite refactor
    useSandboxState: handleChipSelect(chipId) → loadScenario(vesselA, vesselB)
    SandboxContainer: remove chip row JSX + activeChipId usage
    (delete chip-scenarios.ts if it has no other consumer after this)
        │
        ├──▶ [2] Gallery → Sandbox wiring            ──┐
        │      SandboxBridgeProvider + useSandboxBridge   │  independent of
        │      GalleryCard: drop <Link>, add                │  each other —
        │      TryOnSandboxButton (hover-reveal)             │  can build in
        │      wrap app/page.tsx in the Provider              │  parallel /
        │                                                       │  either order
        └──▶ [3] Sandbox chart restructure             ──┘
               ChartHeaderStrip (replaces VerdictBanner)
               ChartFooterStrip (replaces InstrumentReadouts)
               VesselControlOverlay (replaces ControlPanel)
               ChartPanel: selectedVessel + click-vs-drag guard (Anti-Pattern 1)

[4] Guided Tour — fully independent, zero shared files with [2]/[3]
       guided-tour-steps.ts, TourStepIllustration.tsx, GuidedTourModal.tsx,
       "How to read this" trigger button in SandboxContainer's existing
       top header row (unaffected by [3]'s chart-card restructure)

[5] Hero preview visual sync — fully independent, static/fixture-driven,
       touches only hero-preview-geometry.ts/HeroPreviewCard.tsx; safe to
       do anytime, lowest risk in the milestone
```

**Rationale for [1] first:** both [2] (needs a generic load function, not a chip-ID lookup) and [3]'s "remove chip row" target feature depend on this same small refactor — doing it once, first, avoids either later step re-deriving it independently.

**[2] and [3] in parallel or either order after [1]:** they touch different files almost entirely (`SandboxBridgeProvider`/`GalleryCard` vs. `ChartHeaderStrip`/`ChartFooterStrip`/`VesselControlOverlay`/`ChartPanel`) — the one shared file is `SandboxContainer.tsx`'s composition JSX, which is a small, low-conflict edit either way. If serialized on one branch, doing [2] before [3] is slightly preferable since [2]'s wiring is more mechanically constrained (the milestone context flags it as the "hard dependency" one) and dislodges the chip-row/`ControlPanel` removal question cleanly before the bigger visual restructure lands.

**[4] and [5] can run anytime, including fully in parallel with [2]/[3]** on separate branches — neither shares a file with the Sandbox/Gallery wiring work. If sequencing on a single branch/PR-per-phase basis (this project's established git workflow, per `CLAUDE.md`), doing them last is lowest-risk since they are additive/cosmetic rather than restructuring existing wiring.

## Sources

- Direct repository inspection (`src/components/sandbox/**`, `src/components/gallery/**`, `src/components/hero/**`, `app/page.tsx`, `app/s/[shareId]/page.tsx`, `components.json`, `package.json`) — HIGH confidence, ground truth for every current-state claim in this document (existing `useSandboxState()` choke point, existing chip-row/`ControlPanel` shape, existing Server/Client boundary at `GalleryContainer`, `radix-ui@^1.6.2` already installed, no `dialog.tsx` yet in `src/components/ui/`)
- `.planning/PROJECT.md` — HIGH confidence, source of the v1.4 target-feature list, locked decisions (Guided Tour in scope, chip row removed, Gallery fully switches to load-in-place), and the project's own documented hit-testing-regression precedent (Phase 4/Phase 8) that directly informs the click-vs-drag Anti-Pattern above
- React Server Components composition pattern ("Server Components as children of Client Components") — this is long-standing, stable Next.js App Router guidance (not a recent/uncertain API), consistent with how this codebase already composes `app/page.tsx` (a Server Component) around `<SandboxContainer/>`/`<GalleryContainer/>` today

---
*Architecture research for: v1.4 Design Sync (Sandbox & Gallery) — COLREGS Navigator*
*Researched: 2026-07-25*
