# Phase 17: Gallery → Sandbox Bridge - Pattern Map

**Mapped:** 2026-07-25
**Files analyzed:** 8 (2 new, 4 modified, 2 fix-only-modified)
**Analogs found:** 8 / 8

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/components/sandbox/bridge/SandboxBridgeProvider.tsx` | provider | pub-sub (Context signal) | `src/lib/trpc/client.tsx` | role-match (both are the app's only two "use client" Providers wrapping Server-rendered children) |
| `app/page.tsx` | route (Server Component composition) | request-response (render composition) | `app/layout.tsx` | exact (identical "Server Component wraps `{children}` in a `\"use client\"` Provider" shape, already proven in this repo) |
| `src/components/gallery/card/TryOnSandboxButton.tsx` | component (interactive client leaf) | event-driven | `src/components/sandbox/control-panel/CopyLinkButton.tsx` | exact (small `"use client"` leaf `Button` with a single `onClick` handler, embedded in an otherwise non-client tree) |
| `src/components/gallery/card/GalleryCard.tsx` | component (Server, presentational) | request-response (render) | itself, pre-change (existing `group`/`group-hover` `<Link>` wrapper) | exact (same file, structural edit not a rewrite) |
| `src/components/hero/Hero.tsx` (reference only, not modified) | — | — | — | used only for the solid-accent `Button` styling reference (`variant="default"`, `size="lg"`) |
| `src/components/sandbox/hooks/useSandboxState.ts` (D-10 fix) | hook (state) | CRUD (state derivation) | itself, current file (lazy initializer at lines 74-82) | exact (in-place fix, not a new file) |
| `src/domain/geometry/bearing/bearing.ts` (D-11 fix) | utility (pure domain function) | transform | itself, current file (coincident-check at line 31) | exact (in-place fix, not a new file) |
| `src/domain/geometry/bearing/bearing.test.ts` / `bearing.fixtures.ts` (D-11 test coverage) | test | transform | itself + `src/domain/geometry/bearing/bearing.fixtures.ts` | exact (extend existing fixture/test pattern) |

## Pattern Assignments

### `src/components/sandbox/bridge/SandboxBridgeProvider.tsx` (provider, pub-sub)

**Analog:** `src/lib/trpc/client.tsx` (full file, 59 lines — read in one pass)

This is the only existing precedent in the codebase for "a `\"use client\"` component whose sole job is to hold state/a client and wrap `{children}`" — exactly `SandboxBridgeProvider`'s shape per `ARCHITECTURE.md` Pattern 2. Note it is consumed by `app/layout.tsx` the same way `SandboxBridgeProvider` will be consumed by `app/page.tsx`.

**Imports pattern** (lines 1-16):
```typescript
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import { useState } from "react";

import type { AppRouter } from "../../server/api/routers/_app.js";
```
For the bridge, the equivalent import block is:
```typescript
"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import type { Vessel } from "../../../domain/vessel/vessel.js";
```

**Core provider pattern** (lines 39-59, the whole `TRPCReactProvider`):
```typescript
export function TRPCReactProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const queryClient = getQueryClient();

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [httpBatchLink({ url: getUrl() })],
    }),
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
```
Directly translates to `ARCHITECTURE.md`'s own worked example (already research-approved, copy verbatim as the starting shape):
```typescript
type PendingScenario = { vesselA: Vessel; vesselB: Vessel; requestId: number };
const SandboxBridgeContext = createContext<{
  pendingScenario: PendingScenario | null;
  requestLoad: (vesselA: Vessel, vesselB: Vessel) => void;
} | null>(null);

export function SandboxBridgeProvider({ children }: { children: ReactNode }) {
  const [pendingScenario, setPendingScenario] = useState<PendingScenario | null>(null);
  const requestLoad = useCallback((vesselA: Vessel, vesselB: Vessel) => {
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

**Error handling pattern:** `trpc.client.tsx` has none (no error path in a pure Provider) — the bridge's only "error" is the `useSandboxBridge()` outside-Provider guard shown above (`throw new Error(...)`), which has no direct precedent elsewhere in this codebase but is the standard React Context guard idiom and is explicitly given in `ARCHITECTURE.md`'s own sample.

**No test file precedent:** neither `client.tsx` nor any other Provider in this codebase has its own `.test.tsx` — Provider correctness here is exercised indirectly through consumer tests (e.g. `SandboxContainer.test.tsx` mocks `../../lib/trpc/client.js` rather than testing `TRPCReactProvider` directly, see Shared Patterns below). Follow the same convention: test `SandboxBridgeProvider`'s effect indirectly through `SandboxContainer.test.tsx` (assert `loadScenario` fires when `pendingScenario.requestId` changes) and through a `TryOnSandboxButton.test.tsx` (assert `requestLoad` is called with the right args), not via a dedicated `SandboxBridgeProvider.test.tsx`.

---

### `app/page.tsx` (route, request-response)

**Analog:** `app/layout.tsx` (full file, 47 lines — read in one pass)

**Current `app/page.tsx`** (full file, 17 lines):
```typescript
import { Hero } from "../src/components/hero/Hero.js";
import { SandboxContainer } from "../src/components/sandbox/SandboxContainer.js";
import { GalleryContainer } from "../src/components/gallery/GalleryContainer.js";

export default function Home() {
  return (
    <>
      <Hero />
      <section id="sandbox">
        <SandboxContainer />
      </section>
      <section id="gallery">
        <GalleryContainer />
      </section>
    </>
  );
}
```

**Analog's Provider-wrapping pattern** (`app/layout.tsx` lines 27-46 — the exact "Server Component wraps `{children}` in a `\"use client\"` Provider" shape to replicate):
```tsx
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={cn("dark font-sans", geistSans.variable, geistMono.variable)}
    >
      <body className="min-h-screen bg-background text-foreground antialiased">
        <Header />
        <main>
          <TRPCReactProvider>{children}</TRPCReactProvider>
        </main>
        <Footer />
      </body>
    </html>
  );
}
```

**Target shape for `app/page.tsx`** (mechanical application of the same pattern — `Home` stays a plain Server Component function; only a new import + one wrapping JSX element are added):
```tsx
import { Hero } from "../src/components/hero/Hero.js";
import { SandboxContainer } from "../src/components/sandbox/SandboxContainer.js";
import { GalleryContainer } from "../src/components/gallery/GalleryContainer.js";
import { SandboxBridgeProvider } from "../src/components/sandbox/bridge/SandboxBridgeProvider.js";

export default function Home() {
  return (
    <SandboxBridgeProvider>
      <Hero />
      <section id="sandbox">
        <SandboxContainer />
      </section>
      <section id="gallery">
        <GalleryContainer />
      </section>
    </SandboxBridgeProvider>
  );
}
```
No error handling / validation section applies — this file has none today and gains none.

---

### `src/components/gallery/card/TryOnSandboxButton.tsx` (component, event-driven)

**Analog:** `src/components/sandbox/control-panel/CopyLinkButton.tsx` (full file, 39 lines — read in one pass)

**Full analog file** (this is the pattern to copy almost verbatim — a `"use client"` leaf rendering a single shadcn `Button` with an `onClick` handler and no other state machinery):
```tsx
"use client";

import { useState } from "react";
import { Check, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CopyLinkButton() {
  const [copied, setCopied] = useState(false);

  async function handleClick(): Promise<void> {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Permission-denied / insecure-context rejection -- leave the button
      // in its normal (uncopied) state rather than an unhandled rejection.
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon-sm"
      onClick={handleClick}
      aria-label={copied ? "Link copied" : "Copy link"}
    >
      {copied ? <Check aria-hidden="true" /> : <Link2 aria-hidden="true" />}
    </Button>
  );
}
```

**Bridge-consumption pattern** — from `ARCHITECTURE.md`'s own worked example (Pattern 2), which is the authoritative shape for this specific button's `onClick` body (note D-07: do NOT hardcode `behavior: "smooth"` as literally shown in the research sample — omit the option or use `"auto"`, per CONTEXT.md D-07):
```tsx
"use client";
export function TryOnSandboxButton({ vesselA, vesselB }: { vesselA: Vessel; vesselB: Vessel }) {
  const { requestLoad } = useSandboxBridge();
  return (
    <button
      type="button"
      onClick={() => {
        requestLoad(vesselA, vesselB);
        document.getElementById("sandbox")?.scrollIntoView({ block: "start" });
        // D-07: no explicit `behavior` override -- reuses app/globals.css's
        // global `scroll-behavior: smooth` (gated behind
        // prefers-reduced-motion), same convention as Hero's #sandbox/
        // #gallery anchor links. Do NOT hardcode behavior: "smooth" here.
      }}
    >
      Try on Sandbox
    </button>
  );
}
```

**Solid accent-button styling reference (D-03):** `src/components/hero/Hero.tsx` lines 52-59 — the app's only existing "solid accent CTA" `Button` usage (default `variant`, since `--primary` and `--accent` are the same teal `#2dd4bf` per `app/globals.css` lines 80-86/122-128):
```tsx
<Button asChild size="lg" className="h-10 gap-2 px-4.5 text-sm font-medium">
  <a href="#sandbox">
    Open the sandbox
    <ArrowRight aria-hidden="true" />
  </a>
</Button>
```
`TryOnSandboxButton` should use `<Button type="button" variant="default" ...>` (the Button component's `default` variant, `src/components/ui/button.tsx` lines 25-28: `bg-primary text-primary-foreground hover:bg-primary/80`) — explicitly NOT `variant="outline"` (that's `CopyLinkButton`'s/Reset's look, ruled out by D-03).

**Icon choice (Claude's discretion, D-02):** `lucide-react` `Play` or `SquarePlay` conveys "load/go" without colliding with `RotateCcw` (Reset) / `Link2` (Save/Copy). Recommend `Play`.

**No test-file precedent exists for `CopyLinkButton.tsx` itself** — but `GalleryCard.test.tsx` (see below) is the right home for asserting `TryOnSandboxButton`'s presence/behavior from the Gallery side; a small standalone `TryOnSandboxButton.test.tsx` (mocking `useSandboxBridge`) mirrors how `SandboxContainer.test.tsx` mocks `../../lib/trpc/client.js` (see Shared Patterns).

---

### `src/components/gallery/card/GalleryCard.tsx` (component, request-response/render)

**Analog:** itself, current file (full file, 80 lines — already read in full above; this is a structural edit, not a new-file build)

**Current wrapper structure to replace** (lines 42-80, the whole component):
```tsx
export function GalleryCard({ id, title, ruleLabel, description, vesselA, vesselB, classification }: GalleryCardProps) {
  const verdict = cardVerdictBadge(classification);

  return (
    <Link
      href={`/s/${id}`}
      aria-label={`Load ${title} scenario into the sandbox`}
      className="
        group block rounded-xl
        focus-visible:ring-2 focus-visible:ring-ring
        focus-visible:outline-hidden
      "
    >
      <Card className="
        h-full gap-0 border border-border px-4 transition-all duration-200
        group-hover:border-primary/40 group-hover:shadow-sm
      ">
        <div className="mb-4">
          <GalleryPreviewChart vesselA={vesselA} vesselB={vesselB} />
        </div>
        {/* badges / title / description unchanged */}
      </Card>
    </Link>
  );
}
```

**D-04's required change:** replace the outer `<Link className="group ...">` with a plain `<div className="group ...">` (drop `href`/`aria-label`/`focus-visible:ring-*` — those affordances move to `TryOnSandboxButton` itself), and extend `group-hover:` to also fire on `group-focus-within:` so Tab-focusing the new button still triggers the card's hover polish (D-04 explicitly requires this — it's a *new* Tailwind modifier combination for this codebase; no existing file uses `group-focus-within` yet, so this is genuinely new, not copied):
```tsx
<div className="
  group relative block rounded-xl
">
  <Card className="
    h-full gap-0 border border-border px-4 transition-all duration-200
    group-hover:border-primary/40 group-hover:shadow-sm
    group-focus-within:border-primary/40 group-focus-within:shadow-sm
  ">
    <div className="relative mb-4">
      <GalleryPreviewChart vesselA={vesselA} vesselB={vesselB} />
      {/* D-01: chart scrim + centered overlay button, both revealed on
          hover/focus-within per D-01/D-04/D-06; low-opacity-by-default +
          full-opacity-on-touch/:active/focus per D-05 (@media (hover: none)) */}
      <TryOnSandboxButton vesselA={vesselA} vesselB={vesselB} title={title} />
    </div>
    {/* badges / title / description JSX otherwise UNCHANGED -- cardVerdictBadge()
        and ROLE_BADGE_CLASSNAME reuse per CONTEXT.md's Reusable Assets list */}
  </Card>
</div>
```

**Import block change:** drop `import Link from "next/link";`, add `import { TryOnSandboxButton } from "./TryOnSandboxButton.js";`.

**Existing test to extend:** `GalleryCard.test.tsx` line 66-84's `"wraps the whole card in a single Link..."` test asserts exactly the behavior D-04 removes — this test must be replaced (not left failing) with an equivalent assertion that (a) no `<Link>`/anchor exists on the card and (b) a button with the "Try on Sandbox" accessible name exists and is reachable via `getByRole("button", { name: /try on sandbox/i })`. Follow this file's existing `classify()` helper + `afterEach(cleanup)` + `@vitest-environment jsdom` conventions (lines 1-22) exactly.

---

### `src/components/sandbox/hooks/useSandboxState.ts` — D-10 fix only (hook, CRUD)

**Analog:** itself, current file, lines 74-82 (the exact code to change in place — no new file, no new analog needed)

**Current (unsafe cast):**
```typescript
const [lastGoodClassification, setLastGoodClassification] = useState<ClassificationResult>(
  () => {
    const initialResult = classifyEncounter(seedA, seedB) as {
      ok: true;
      value: ClassificationResult;
    };
    return initialResult.value;
  },
);
```

**Required fix shape** (add a real `.ok` check + safe fallback, per D-10 — fallback candidate is `crossingResidualBasicCase`, already imported at line 15 as the file's own seed-of-last-resort, satisfying "the file's own known-good default" per D-10's discretion note):
```typescript
const [lastGoodClassification, setLastGoodClassification] = useState<ClassificationResult>(
  () => {
    const initialResult = classifyEncounter(seedA, seedB);
    if (initialResult.ok) return initialResult.value;
    // D-10: seed vessels are supposed to always classify successfully (see
    // this function's own header comment); if that invariant is ever
    // violated, fall back to the app's known-good default fixture rather
    // than crash on an unchecked cast.
    const fallback = classifyEncounter(
      crossingResidualBasicCase.vesselA,
      crossingResidualBasicCase.vesselB,
    );
    if (fallback.ok) return fallback.value;
    throw new Error("crossingResidualBasicCase fixture failed to classify — invariant broken");
  },
);
```
This follows the exact `Result<T>`/`.ok` narrowing idiom already used everywhere else in this same file's `applyVesselUpdate()` (lines 105-116) and in `bearing.test.ts` (`if (result.ok) { ... }`) — no new pattern, just applying the codebase's own established `Result` discriminated-union check to the one place that currently skips it.

---

### `src/domain/geometry/bearing/bearing.ts` — D-11 fix only (utility, transform)

**Analog:** itself, current file, full file already read above (39 lines)

**Current exact-equality check (line 31):**
```typescript
if (dx === 0 && dy === 0) {
  return err("coincident-position", { a, b });
}
```

**Required fix shape** (widen to a small distance threshold, per D-11 — threshold value and its rationale are Claude's discretion; document the choice inline as a comment per D-11's instruction, e.g. matching this file's existing comment density/style):
```typescript
// D-11: widened from exact dx===0 && dy===0 equality to a small distance
// threshold -- a drag gesture can land the two vessels a sub-pixel
// fraction apart in chart-space units without ever producing exact
// floating-point equality, which let genuinely-coincident-looking drags
// slip past this guard and reach atan2 with a near-zero (but nonzero)
// argument, producing a wildly unstable bearing rather than the intended
// "unable to classify" degenerate signal. 1e-6 chart-space units is far
// below any real, humanly-perceptible vessel separation on this chart's
// viewBox scale, so it only catches true coincident/near-coincident drags.
const COINCIDENT_DISTANCE_THRESHOLD = 1e-6;
if (Math.hypot(dx, dy) < COINCIDENT_DISTANCE_THRESHOLD) {
  return err("coincident-position", { a, b });
}
```

**Test/fixture pattern to extend:** `src/domain/geometry/bearing/bearing.fixtures.ts`'s existing `coincidentPositionCase` (lines 53-58) covers only exact equality; add a new fixture (e.g. `nearCoincidentPositionCase`) with a sub-threshold but nonzero `dx`/`dy`, and a corresponding `it(...)` block in `bearing.test.ts` mirroring lines 60-70's `"coincident positions return err('coincident-position')"` test structure exactly (same `expect(result.ok).toBe(false)` / `if (!result.ok) expect(result.reason).toBe("coincident-position")` shape).

---

## Shared Patterns

### Server Component composing a "use client" Provider around Server-rendered children
**Source:** `app/layout.tsx` lines 27-46 (`RootLayout` wrapping `{children}` in `<TRPCReactProvider>`)
**Apply to:** `app/page.tsx`'s `SandboxBridgeProvider` wrap — this is not a new architectural shape for this codebase, it is the exact existing root-layout pattern applied one level down the tree.

### "use client" leaf Button embedded in an otherwise Server/non-client tree
**Source:** `src/components/sandbox/control-panel/CopyLinkButton.tsx` (full file)
**Apply to:** `TryOnSandboxButton.tsx` — same shape (import `Button` from `@/components/ui/button`, single `onClick`, no external state beyond what the click needs).

### `Result<T>` `.ok` discriminated-union narrowing (never an unchecked cast)
**Source:** `src/domain/shared/result.ts` (type definition) + `src/components/sandbox/hooks/useSandboxState.ts` lines 105-116 (`applyVesselUpdate`'s existing `if (result.ok) { ... } else { ... }`) + `src/domain/geometry/bearing/bearing.test.ts` (every test's `if (result.ok) { ... }` guard)
**Apply to:** D-10's fix in `useSandboxState.ts` — the fix is simply applying this already-universal codebase idiom to the one lazy-initializer call site that currently bypasses it.

### Mocking `../../lib/trpc/client.js` / `next/navigation` at the top of a component test file, rather than testing a Provider directly
**Source:** `src/components/sandbox/SandboxContainer.test.tsx` lines 31-50
**Apply to:** Any new test exercising `SandboxBridgeProvider` indirectly — mock `useSandboxBridge()` the same way `SandboxContainer.test.tsx` mocks `trpc`, rather than writing a dedicated Provider unit test (no precedent for the latter in this codebase).

### `group`/`group-hover:` Tailwind convention, now extended with `group-focus-within:`
**Source:** `src/components/gallery/card/GalleryCard.tsx` lines 49-58 (existing `group`/`group-hover:` pair)
**Apply to:** `GalleryCard.tsx`'s D-04 change — every `group-hover:` utility added for the hover-reveal must have a matching `group-focus-within:` utility (this pairing does not exist anywhere yet in this codebase, so there is no in-repo analog for the `group-focus-within:` half specifically — treat it as a mechanical Tailwind-documented extension of the existing `group-hover:` pattern already in use, not a new pattern to invent).

### Solid accent-colored `Button` (`variant="default"`)
**Source:** `src/components/hero/Hero.tsx` lines 52-59 (`<Button asChild size="lg">` — no `variant` prop, i.e. default)
**Apply to:** `TryOnSandboxButton.tsx` per D-03 — explicitly avoid `variant="outline"` (the Reset/Save/CopyLink look).

## No Analog Found

None — all 8 files in scope had a usable in-repo analog (some being the file's own current version for an in-place fix, per the classification table above). The one genuinely new sub-pattern with zero precedent is `group-focus-within:` (see Shared Patterns above); it is a mechanical Tailwind extension of an existing pattern, not a gap requiring RESEARCH.md fallback.

## Metadata

**Analog search scope:** `src/components/**`, `app/**`, `src/domain/geometry/bearing/**`, `src/components/sandbox/hooks/**` — full-repo file listing enumerated via `find`, all 8 in-scope files' closest analogs read directly (no Grep-based large-file search needed; largest file read was 185 lines).
**Files scanned:** 18 (full reads) across components, hooks, domain geometry, and page/layout composition.
**Pattern extraction date:** 2026-07-25
