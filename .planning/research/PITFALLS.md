# Pitfalls Research

**Domain:** Retrofitting shadcn/ui + Tailwind v4 dark-only theming onto an existing Next.js 16 app with a hand-rolled interactive SVG chart, plus a route-to-anchor page migration
**Researched:** 2026-07-18
**Confidence:** HIGH (grounded in this repo's actual source — `ChartPanel.tsx`, `useHullDrag.ts`, `useRotateHandleDrag.ts`, `ControlPanel.tsx`/`.test.tsx`, `vitest.config.ts`, `app/gallery/page.tsx`, `app/page.tsx` — cross-checked against Context7 shadcn/ui + Tailwind CSS docs and current Next.js 16 docs); MEDIUM where only WebSearch-verified community sources are cited (flagged inline)

## Critical Pitfalls

### Pitfall 1: Redesign silently breaks the already-fixed SVG hit-testing contract, and existing tests cannot catch it

**What goes wrong:**
`ChartPanel.tsx`'s hull polygon and rotate-handle circle rely on a structural contract: the pointer handlers are attached to the actual visible, solid-`fill`-painted shape, so SVG's default `pointer-events: visiblePainted` only fires where the user can actually see something to grab (`HULL_FILL_CLASS` gives the polygon `fill-red-500`/`fill-green-500`/`fill-slate-400`; the rotate handle has `fill="white"`). This is the fix for a bug PROJECT.md documents as having taken **two rounds of live human UAT** to root-cause in Phase 4. A visual redesign is very likely to touch exactly these two elements — e.g. restyling the hull to a stroke-only "outline vessel icon" (`fill="none"` + `stroke=...`) to match a more modern/minimal design aesthetic, or swapping the literal Tailwind color classes for new shadcn semantic tokens (`fill-destructive`/`fill-primary`/`fill-muted` — see Pitfall 3) without checking that the referenced token actually resolves to a non-transparent fill. The moment `fill` becomes `"none"` (or a token that resolves to `transparent`), the shape is no longer hit-tested by `visiblePainted` and dragging/rotating breaks in the browser — silently, with no error, no failing type-check.

**Why it happens:**
The existing Vitest test suite (`useHullDrag.test.ts`, `useRotateHandleDrag.test.ts`, `ChartPanel.test.tsx`) runs under `@vitest-environment jsdom` (per-file, not global — the project's default `vitest.config.ts` environment is `"node"`). jsdom does not implement layout, paint, or CSS-based hit-testing; RTL's `fireEvent`/`user-event` `pointer()` API dispatches `PointerEvent`s directly at the DOM node you already selected (by `data-testid`), never resolving "what's under these screen coordinates" the way a real browser does. This means **the tests validate the gesture-handling logic (capture/release, coordinate math) but structurally cannot validate the visibility-based hit-testing contract that was the actual root cause of the original bug.** All 24 test files can stay green while the production hit-testing contract is silently broken.

**How to avoid:**
- Before restyling `VesselGroup`'s hull polygon/rotate circle, keep the invariant explicit as a code comment rule (it already exists in `ChartPanel.tsx`'s comments — keep and extend it) and treat any diff touching `fill` on these two elements as requiring manual verification, not just `npm test` passing.
- Never set `fill="none"` (or a CSS variable/token that can resolve to `transparent`/opacity-0) on the hull polygon or rotate-handle circle. If the design calls for a stroke-only/outline look, keep a real, visible (if subtle) fill matching the new palette rather than relying on `pointer-events="all"` as a blanket fallback (see Technical Debt Patterns — that fallback reintroduces the original bug class).
- Add a mandatory **manual drag+rotate UAT pass in a real browser** to the Sandbox phase's success criteria (matching Phase 4's precedent), not just a green test suite, before merging the Sandbox phase PR.
- Do not delete or thin out the existing comments in `ChartPanel.tsx` that document the `visiblePainted` contract — they are load-bearing institutional memory for exactly this pitfall.

**Warning signs:**
- Any diff that changes a `fill`/`fill-*` value on `<polygon data-testid="hull-hit-*">` or `<circle data-testid="rotate-hit-*">`.
- A restyle PR where `npm test` is green but nobody dragged a vessel in an actual browser tab.
- Introducing shared/decorative "read-only" SVG chart previews (see Hero-phase note under Pitfall 8) that get refactored to share code with the real interactive chart.

**Phase to address:** Sandbox (primary); Hero (if a decorative chart preview shares code with `ChartPanel`)

---

### Pitfall 2: Half-wiring a light/dark toggle nobody uses, so the app renders in light mode by default

**What goes wrong:**
shadcn/ui's default scaffold (both the CLI and the docs' manual-install snippet) ships **both** a `:root` block (light palette) and a `.dark` block (dark palette) plus `@custom-variant dark (&:is(.dark *));`, on the assumption a `next-themes`-driven toggle will add/remove the `.dark` class on `<html>` at runtime. If a team copies this scaffold for a stated "dark-mode only, no toggle" project but never actually adds `class="dark"` to `<html>` (because there's no toggle to do it, and nobody remembers to hardcode it), the app renders using the **light** `:root` values by default — i.e., the opposite of the intended design — even though a `.dark` block with the correct palette exists unused in the CSS. This is the exact "half-wired" trap: the CSS *looks* complete (both palettes are there) but the switch that was supposed to select between them was never installed and nothing selects the dark one.

**Why it happens:**
Every shadcn/ui doc example, CLI-generated file, and blog post assumes a toggle exists, because toggle-based dark mode is shadcn's default supported pattern (confirmed via Context7 `/shadcn-ui/ui` theming docs — the shipped scaffold always includes both `:root` and `.dark`). Nothing in the tooling itself enforces "delete the toggle-only machinery" for a hard-coded single-theme project; it's a manual step a redesign can silently skip, especially across a 4-phase, multi-PR migration where the Scaffolding phase sets up the CSS and later phases (Hero, Sandbox, Gallery) just consume the resulting utility classes without re-checking the base setup.

**How to avoid:**
- In the Scaffolding phase, either:
  1. **Recommended — keep the standard two-block shape but collapse it to one palette:** put the dark palette values directly under `:root` (so there is no "light default" to accidentally fall back into), keep the `.dark` block present (equal to `:root` or simply retained) for forward compatibility with future `npx shadcn add` runs that may re-diff against the standard file shape, and **still add `className="dark"` to the root `<html>` element in `app/layout.tsx` as a hardcoded, permanent attribute** (not state, not a toggle, no `next-themes` dependency) — this gives defense-in-depth: even if a future component or copy-pasted shadcn recipe snippet includes a literal `dark:`-prefixed utility class, it still resolves correctly because `.dark` is genuinely present on `<html>`.
  2. Or, simpler: delete the `@custom-variant dark (...)` line and the `.dark` block entirely, put the dark palette straight into `:root`, and never use `dark:`-prefixed classes anywhere in the codebase (grep for `dark:` in CI/lint as a guard). This is simplest but means any future shadcn block/recipe copy-pasted from docs (which often includes `dark:` variants for polish) silently no-ops its dark-specific styling — acceptable only if the team is disciplined about never introducing `dark:` classes.
- Do **not** install `next-themes` or a `ThemeProvider` at all — it is machinery for a toggle this project has explicitly decided not to have (per PROJECT.md's locked decision: "Dark-mode only, no light theme/toggle").
- Add a one-line check to the Scaffolding phase's manual-verification checklist: "view the app with system/browser color-scheme set to light — it must still render dark."

**Warning signs:**
- `app/layout.tsx`'s `<html>` tag has no `dark` class and no other permanent dark-forcing mechanism, yet `globals.css` still defines a light `:root` palette.
- Any `ThemeProvider`/`next-themes` import appears in the diff for a project that locked "no toggle" as a decision.
- The app looks correct in local dev (because the developer's OS is set to dark) but wrong when demoed on a machine/browser set to light — the single most likely way this bug is discovered late, e.g. during a portfolio demo.

**Phase to address:** Scaffolding (must be fixed before Hero/Sandbox/Gallery build any UI against the token system)

---

### Pitfall 3: Custom/domain-semantic color tokens (give-way / stand-on / mutual) never registered in Tailwind v4's `@theme`, so their utility classes silently don't exist

**What goes wrong:**
Tailwind v4's CSS-first config generates utilities like `bg-*`, `text-*`, `fill-*`, `stroke-*` **only** for CSS custom properties declared under the `--color-*` namespace inside an `@theme` (or `@theme inline`) block — this is different from Tailwind v3, where any config-declared color automatically worked. The current code hardcodes vessel-role colors as literal Tailwind palette classes (`HULL_FILL_CLASS`: `"fill-red-500"`, `"fill-green-500"`, `"fill-slate-400"`). If the redesign introduces new semantic names to match the design system (e.g. `fill-give-way`, `fill-stand-on`, `fill-mutual`, or reuses shadcn's `--color-destructive`/`--color-chart-1..5`) but forgets to register `--color-give-way`, `--color-stand-on`, etc. under `@theme`, Tailwind's JIT scanner will not generate those utility classes at all — the class name appears in the JSX but produces zero CSS, and the shape silently renders with no fill (which, per Pitfall 1, also breaks pointer hit-testing).

**Why it happens:**
This is a genuinely new failure mode introduced by Tailwind v4's CSS-first model, and it fails silently (no error, no warning — the class just doesn't exist in the generated stylesheet) rather than loudly, which is what makes it a real pitfall rather than an annoyance developers immediately notice.

**How to avoid:**
- When migrating `HULL_FILL_CLASS`/`GRID_STROKE`/`BEARING_LINE_DEFAULT_STROKE`/etc. to the new design system, explicitly add each new semantic color as a `--color-<name>` variable inside the project's `@theme` (or `@theme inline`, if it needs to vary — see Pitfall 4) block in `globals.css` before referencing it as a `fill-<name>`/`stroke-<name>`/`bg-<name>` utility class.
- Prefer reusing shadcn's existing `--color-chart-1` through `--color-chart-5` tokens (already wired into `@theme inline` by the default scaffold) for the three vessel-role colors rather than inventing new token names — fewer moving parts to wire up correctly, and shadcn ships these specifically for data-visualization use cases like this.
- Verify with a quick check of the compiled/dev CSS (or Tailwind's own class-detection in devtools) that `fill-give-way` (or whichever name is chosen) actually appears in generated output before relying on it — do not just trust that the class "looks right" in JSX.

**Warning signs:**
- A vessel hull renders with no visible fill (transparent/default) after a restyle, and devtools shows the `fill-*` class applied but no matching CSS rule generated.
- Any new semantic color name is added to a `Record<Role, string>`-style lookup table without a corresponding `--color-*` declaration appearing in the same PR's `globals.css` diff.

**Phase to address:** Sandbox (vessel role colors), Scaffolding (any shared/global semantic tokens the design introduces)

---

### Pitfall 4: shadcn's default `:root`/`.dark` + `@theme inline` split is treated as unnecessary ceremony for a single-theme app, but removing it wrong breaks utilities or future `shadcn add` compatibility

**What goes wrong:**
Because this design only ever has one theme, it's tempting to skip the indirection entirely and hardcode raw color values directly inside `@theme { --color-primary: oklch(...); }` (bypassing the `:root` custom-property layer and `@theme inline` reference layer shadcn normally uses to let `.dark` swap values at runtime). This mostly works for the app's own components, but two things can go wrong: (1) utilities like `bg-primary` behave differently depending on whether the value is declared as a **static** build-time value in plain `@theme` vs. a runtime `var(--foo)` reference in `@theme inline` — mixing the two conventions inconsistently across the same file is a documented source of "colors appear black/white" bugs (community-verified, MEDIUM confidence — see Sources); (2) if the team later runs `npx shadcn add <new-component>` to pull in a component not yet installed, the CLI/registry assumes the standard `:root` + `.dark` + `@theme inline` shape and may generate a diff or new file that doesn't merge cleanly with a heavily simplified/nonstandard `globals.css`.

**Why it happens:**
Tailwind v4's `@theme` directive has two related-but-different forms (`@theme` bakes the value at build time; `@theme inline` keeps a `var(--foo)` reference so runtime CSS-variable overrides, like `.dark` swapping `--background`, still work) and shadcn's whole point in using `@theme inline` is to preserve that runtime-swap capability — capability this project has explicitly decided not to need (no runtime toggle). It's easy to "simplify away" the indirection without realizing which specific colors/utilities depend on it working a particular way.

**How to avoid:**
- Keep the standard shadcn shape (`:root` + `.dark` + `@theme inline`) even though only one theme is ever active — per Pitfall 2's recommendation, just make both blocks equal or make `:root` the dark palette. This keeps the project forward-compatible with future `npx shadcn add` runs and avoids the build-time-vs-runtime `@theme`/`@theme inline` confusion entirely, at the cost of a small amount of "unused" indirection.
- If simplifying anyway, do it consistently: either everything goes through `@theme inline` + `:root` custom properties, or everything is hardcoded directly in a single `@theme` block — never mix the two forms for different tokens in the same file.

**Warning signs:**
- Some shadcn component colors render correctly and others render as black/white/unstyled after a "simplify the theme file" refactor.
- `npx shadcn add` (if ever run again mid-project) produces a large/unexpected diff against `globals.css`.

**Phase to address:** Scaffolding

---

### Pitfall 5: Introducing shadcn's Radix-based `Select` breaks the existing `userEvent.selectOptions` test and needs jsdom polyfills this project deliberately doesn't install globally

**What goes wrong:**
`ControlPanel.tsx` currently renders the vessel-type picker as a plain native `<select>`, and `ControlPanel.test.tsx` (line 132) drives it with `await user.selectOptions(vesselBSelect, "fishing")` — the standard Testing Library helper for **native** `<select>` elements only. shadcn's `Select` component is Radix-based: a `button[role=combobox]` trigger plus a portalled listbox (`SelectContent` renders into `document.body` via a portal, not as a DOM child of the trigger). `userEvent.selectOptions` does not work against this structure at all (confirmed via community reports — Radix `Select` simply isn't a native `<select>`, `selectOptions` has nothing to act on). Swapping the control without rewriting the test produces a test failure that looks like a Testing Library/DOM query bug rather than what it actually is: a fundamentally different interaction model.

Separately, Radix primitives (`Select`, `Slider`, and any others introduced — e.g. if the speed input becomes a shadcn `Slider`) call browser APIs jsdom does not implement: `Element.hasPointerCapture`/`setPointerCapture`/`releasePointerCapture`, and `HTMLElement.prototype.scrollIntoView`. This project already hit this exact class of problem with its own hand-rolled drag code and has an established, deliberate pattern for it: **per-test-file** `// @vitest-environment jsdom` pragmas plus **minimal, local** polyfills (see `ChartPanel.test.tsx`'s `MockResizeObserver`), not a blanket global jsdom environment or a kitchen-sink global polyfill file. Any new test exercising a shadcn `Select`/`Slider` needs the same treatment (adding `scrollIntoView`/pointer-capture shims local to that test file) — copying a generic "add these to your global setup" tutorial snippet into `vitest.setup.ts` would be inconsistent with the codebase's existing, intentional convention (`vitest.config.ts`'s global `environment: "node"` default plus explicit per-file `jsdom` opt-in).

**Why it happens:**
Radix's interaction model (portals, `role=combobox`/`listbox` ARIA pattern, pointer-capture-based drag for `Slider`) is a deliberate accessibility/behavior upgrade over native form controls, but it means "just swap the JSX, keep the test" does not hold — this is a widely-reported shadcn/Radix migration friction point (community-verified, MEDIUM-HIGH confidence, multiple independent sources).

**How to avoid:**
- Treat every native-`<select>`→shadcn-`Select` (and native `<input type=number>`/`<input type=range>`→shadcn-`Slider`, if adopted for vessel speed) swap in the Sandbox phase as requiring a **test rewrite**, not a test fix: click the trigger (`await user.click(screen.getByRole("combobox"))`), then click the option by ARIA role/name (`await user.click(await screen.findByRole("option", { name: "Fishing" }))`) — `findByRole` (async) is required because `SelectContent` mounts into the portal only once opened.
- Add the pointer-capture/`scrollIntoView` polyfills locally in whichever test file(s) newly exercise `Select`/`Slider`, following the existing `MockResizeObserver`-in-`ChartPanel.test.tsx` pattern (minimal, scoped, documented with a one-line "why" comment) rather than a global blanket shim.
- Consider shadcn's own **"Native Select"** component variant (a styled wrapper around a real `<select>`, shipped alongside the Radix-based `Select` in the current shadcn registry) for the vessel-type picker specifically, if the dropdown doesn't need rich custom item rendering — this keeps `userEvent.selectOptions` working unmodified and avoids the portal/polyfill problem entirely. Worth a deliberate choice, not a default, since it trades some visual/animation polish for test simplicity and native mobile behavior.

**Warning signs:**
- `ControlPanel.test.tsx` line 132 (`user.selectOptions(...)`) starts failing with a confusing "element not found"/"not a select element" error immediately after a `Select` component swap.
- New Radix components in the Sandbox phase throw `TypeError: target.hasPointerCapture is not a function` or `scrollIntoView is not a function` under Vitest.

**Phase to address:** Sandbox

---

### Pitfall 6: Route-to-anchor migration breaks deep-linking/scroll behavior because URL fragments never reach the server and Next.js's hash-scroll-on-navigation is unreliable

**What goes wrong:**
The plan is: remove the standalone `/gallery` route (currently `app/gallery/page.tsx`, an async Server Component calling `getCaller().gallery.list()` directly), embed its content as an `id="gallery"` section on the home page, and add a `next.config.ts` `redirects()` entry sending `/gallery` → `/#gallery`. Two independent things can silently fail here:
1. **Server-side redirect matching never sees the fragment.** URL fragments (`#gallery`) are a client-only construct — the browser strips them before sending the HTTP request, so `next.config.ts`'s `redirects()` `source`/`has`/`missing` matching logic (which runs server-side) can never match or vary behavior based on a hash. This isn't a blocker for this specific migration (the redirect only needs to match the *path* `/gallery`, and browsers do honor a `#fragment` written into the `destination` string as part of the resulting `Location` header — standard HTTP browser behavior, not a Next-specific feature) but it does mean you cannot build a smarter per-hash redirect table server-side; the redirect is necessarily a single static rule.
2. **Scrolling to the hash after the redirect completes is unreliable.** Next.js's own hash-scroll behavior (both via `<Link href="/#gallery">` and via a raw browser navigation following a 308 redirect) has known gaps: clicking a `Link` that only changes the hash sometimes updates the URL bar without actually scrolling to the target element (a long-standing, still-open App Router behavior gap per community/first-party issue reports); and even when it does scroll, Next.js explicitly skips `position: sticky`/`fixed` elements when computing the scroll target, so a sticky header (this design has one, per the Scaffolding phase's Header/Nav) can end up covering the top of the `#gallery` section after the "successful" scroll.

**Why it happens:**
Fragment-based navigation was designed for static, same-document anchor jumps in an era before client-side routers with async data/layout — Next.js's router has to reconcile "did the target element exist in the DOM yet when I tried to scroll" (a real risk here, since the gallery section's content comes from a server-fetched list) with historically browser-native anchor scrolling.

**How to avoid:**
- Keep the redirect simple and let the browser handle the fragment natively: `{ source: "/gallery", destination: "/#gallery", permanent: true }` (308, since this is a permanent structural change, not a temporary one) — do not try to pass query/has-based logic that depends on the fragment; it can't.
- Since the Gallery section's data currently loads via a **Server Component** async call (`await getCaller().gallery.list()`), keep it that way when merging into the home page tree — the section's HTML (including the `id="gallery"` target element) is present in the initial server-rendered payload, not appended later by client-side data fetching. This sidesteps the "element doesn't exist yet when the router tries to scroll" failure mode almost entirely, since the target exists on first paint.
- Explicitly test (don't assume) the redirect + scroll behavior in a real browser for: (a) a fresh browser tab navigating directly to `/gallery` (full page load, not client nav) — this is the realistic "someone has the old link bookmarked" case and behaves differently (full HTTP redirect + browser-native fragment scroll) than (b) clicking an in-app `<Link href="/#gallery">` from the header nav (client-side hash update, more prone to the known Next.js scroll gap).
- Add `scroll-padding-top` (sized to the sticky header's height) to the scrolling container (`html` or the relevant scroll container) so that even when the browser/Next.js does scroll to `#gallery`, the section's heading isn't hidden underneath the sticky header.
- If (b) above is found to be unreliable in manual testing, add a small client-side effect (in the home page's client boundary) that listens for `window.location.hash === "#gallery"` on mount and calls `document.getElementById("gallery")?.scrollIntoView()` as an explicit fallback — but only after confirming the native behavior actually needs it; don't add this defensively up front.

**Warning signs:**
- Following the old `/gallery` bookmark in a fresh tab loads the home page at the top instead of scrolled to the gallery section.
- Clicking a `/#gallery` nav link from elsewhere on the site changes the URL bar to include `#gallery` but the viewport doesn't move (the known App Router gap).
- The gallery heading is technically "scrolled to" but sits directly underneath the sticky header, visually cut off.

**Phase to address:** Gallery

---

### Pitfall 7: shadcn CLI `init`/`add` overwrites or conflicts with existing hand-authored Tailwind v4 config

**What goes wrong:**
The app already has a working, hand-authored Tailwind v4 setup (custom breakpoints at 900px/640px per the design, presumably custom fonts once Geist is added, and existing utility-class usage throughout `ChartPanel.tsx`/`ControlPanel.tsx`). Running `npx shadcn init` (and later `npx shadcn add <component>`) against an existing project is documented to overwrite existing component files and can rewrite `globals.css`/`components.json` wholesale rather than merging surgically with what's already there — losing custom breakpoints, font tokens, or existing project conventions if the diff isn't reviewed.

**Why it happens:**
The CLI is optimized for greenfield or "already-shadcn" projects; it has limited awareness of arbitrary pre-existing hand-authored Tailwind customizations and, per its own documentation/community reports, will overwrite existing components without confirmation in some flows.

**How to avoid:**
- Commit before running any `shadcn` CLI command in the Scaffolding phase.
- Review the full diff on `globals.css`/`components.json`/any touched files after `init`, and manually re-merge existing custom breakpoints/fonts/tokens rather than accepting the CLI's version wholesale or discarding it wholesale.
- Run `init` early (Scaffolding phase, first PR) before any other phase has built UI depending on the pre-shadcn CSS shape, to minimize the blast radius of any config restructuring.

**Warning signs:**
- Custom breakpoints (900px/640px) or font tokens silently disappear from `globals.css` after running a `shadcn` CLI command.
- `components.json`'s `tailwind.css` path or `aliases` config point somewhere inconsistent with the project's actual file layout (`app/` at repo root, not `src/app/`).

**Phase to address:** Scaffolding

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|-----------------|-----------------|
| Adding a fallback `pointer-events="all"` attribute to the hull/rotate shapes "just in case," instead of confirming `fill` stays non-`"none"` | Removes the temptation to worry about Pitfall 1 during the redesign | Reintroduces exactly the "invisible/mismatched hit-target" failure mode the Phase 4 fix eliminated — a `pointer-events="all"` shape can be grabbed anywhere in its bounding geometry regardless of what's actually painted, which is the bug, not the fix | Never as a first choice; only as a documented, deliberate exception if a specific design element truly needs an invisible hit-region larger than its visible paint (not the case for the hull/rotate handle) |
| Skipping the `:root`/`.dark` dual-block shadcn convention and hardcoding one palette directly, to "reduce boilerplate" for a dark-only app | Slightly less CSS to read/maintain up front | Future `npx shadcn add` runs and any copy-pasted shadcn doc snippet with `dark:` classes silently misbehave; harder to onboard a future contributor familiar with shadcn's standard shape | Acceptable only if paired with a lint/grep guard banning `dark:`-prefixed classes anywhere in the codebase (Pitfalls 2/4) |
| Leaving `userEvent.selectOptions`-based tests unmigrated and instead reaching for a workaround (e.g. keeping a hidden native `<select>` around) to make old assertions "pass" | Test suite stays green with minimal edits | Tests stop verifying real user interaction with the component actually shipped (a hidden native select nobody clicks in production) — false confidence | Never; rewrite the test to match the real interaction model (Pitfall 5) |
| Adding global jsdom polyfills (pointer capture, `scrollIntoView`, etc.) to `vitest.setup.ts` for convenience once shadcn Select/Slider land | One place to add shims instead of per-file | Breaks from this project's established, deliberate `environment: "node"` global default + per-file `jsdom` opt-in convention; makes it harder to reason about which tests actually need a DOM at all | Acceptable only if the team explicitly decides to change the global test-environment convention project-wide, as a conscious decision — not as an incidental side effect of adding Select/Slider |

## Integration Gotchas

Common mistakes when connecting to external services/tools.

| Integration | Common Mistake | Correct Approach |
|-------------|-----------------|-------------------|
| `shadcn` CLI `init`/`add` against an existing, hand-authored Tailwind v4 `globals.css` | Running `shadcn init` (or `add --force`/`add -o`) and letting it overwrite existing custom breakpoints (900px/640px) or component files without reviewing the diff | Commit before running any `shadcn` CLI command; review the diff on `globals.css`/`components.json` afterward; merge the CLI's default token block with the project's existing custom tokens rather than accepting either wholesale |
| Radix-based shadcn `Select`/`Slider`/`Dialog` etc. + Vitest/jsdom | Assuming Radix components "just work" under the same jsdom setup as native form elements, then being surprised by `hasPointerCapture`/`scrollIntoView` `TypeError`s | Add scoped per-file polyfills (matching this project's existing `MockResizeObserver` pattern) only in test files that render Radix components requiring them |
| `next.config.ts` `redirects()` for the `/gallery` → `/#gallery` move | Assuming the redirect's `source`/`has` matching can key off the fragment, or forgetting `permanent: true` for what is a permanent structural change (leaving stale 307s that browsers/search engines won't cache) | Match only on the path (`/gallery`); write the fragment directly into `destination`; use `permanent: true` (308) |
| Existing internal navigation (Header/Nav built in Scaffolding phase) linking to the gallery section | Nav links point at the old `/gallery` path (working, but forces every internal click through an unnecessary redirect hop) instead of directly at `/#gallery` | Point all new in-app navigation directly at `/#gallery` (or a same-page anchor `#gallery` if already on `/`); the `next.config.ts` redirect exists only to catch *external*/bookmarked links to the old path |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Merging the Gallery section's server data-fetch into the same home-page Server Component render as the Hero/Sandbox content, without a clean subtree boundary | Home page's Time-to-First-Byte/streamed content grows as the curated-scenario list grows, even though the sandbox above it is interactive-only and doesn't need the gallery data | Keep the gallery data-fetch scoped to its own section (a dedicated async Server Component subtree, not hoisted into the top-level page function) so it can stream/suspend independently of the Hero/Sandbox content above it | Noticeable once the curated gallery list grows well beyond the current handful of seed scenarios — not a concern at today's scale, but worth keeping the boundary clean now rather than retrofitting later |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-------------------|
| Vessel role badge text (`fill-current` on the `<text>` label) inherits an ancestor `color` value tuned for the old light chart background (`bg-white`) | After the dark-palette restyle, the give-way/stand-on/mutual label text can render dark-on-dark and become unreadable/invisible, even though the shape/color-coding around it is otherwise correct | Set an explicit, dark-background-appropriate text color token on (or near) the vessel label rather than relying on inherited `currentColor`; verify contrast against the new dark chart background specifically, not just against the page background |
| Chart grid/bearing-line/cone colors remain hardcoded light-mode hex values (`GRID_STROKE = "#E2E8F0"`, `BEARING_LINE_DEFAULT_STROKE = "#475569"`, `CONE_DEFAULT_STROKE = "#CBD5E1"`, plus the `<svg>`'s own `bg-white border-slate-200`) | If only some of these are migrated to the new dark palette and others are missed (they're plain string constants, not Tailwind classes, so a project-wide search for Tailwind utility names won't catch them), the chart ends up a mix of light-on-dark, producing a visually broken "half-migrated" chart | Treat these hardcoded hex constants as an explicit checklist item in the Sandbox phase (they will not show up in a search for `dark:` or shadcn token names) — search specifically for hex-literal color strings (`#[0-9A-Fa-f]{3,6}`) in `ChartPanel.tsx` as part of the phase's done-checklist |
| Focus ring color hardcoded per-input (`focus:outline-teal-600` in `ControlPanel.tsx`) instead of using the shared shadcn `--ring` token | Inconsistent focus-ring color between native inputs left as-is and any new shadcn components introduced alongside them in the same panel | When restyling `ControlPanel`, replace ad hoc `focus:outline-*` utilities with the shared `ring`/`--color-ring` token so focus styling is visually consistent across native and shadcn-sourced controls |

## "Looks Done But Isn't" Checklist

- [ ] **Dark-only theming:** Looks correct in local dev — verify it *also* renders dark with the OS/browser color-scheme preference set to light, and that `<html>` carries a permanent `dark` class (or the `.dark`/`:root` split was deliberately collapsed) rather than depending on `prefers-color-scheme` or an unused toggle.
- [ ] **Restyled vessel hull/rotate handle:** Passes `npm test` — verify by *actually dragging and rotating a vessel in a real browser tab*, not just reading green test output (jsdom cannot verify the `visiblePainted` hit-testing contract).
- [ ] **New semantic color tokens (vessel-role colors, any custom design-system colors):** Referenced in JSX as `fill-*`/`bg-*`/`text-*` classes — verify the corresponding `--color-*` variable actually exists in `@theme`/`@theme inline` and the class shows up in generated CSS, not just in source.
- [ ] **Vessel-type `Select` (if migrated to shadcn):** `ControlPanel.test.tsx` still calls `user.selectOptions` — verify it was rewritten to the click-based Radix interaction pattern, not left silently broken or "fixed" by reverting to a hidden native select nobody clicks in production.
- [ ] **`/gallery` → `/#gallery` migration:** The redirect config exists — verify by testing a *fresh, non-client-routed* navigation to the old `/gallery` URL (not just clicking an in-app link) and confirming both the redirect *and* the scroll-to-anchor actually land the user on the gallery section, not just somewhere on the home page.
- [ ] **Sticky header + anchor scroll:** Scrolling to `#gallery` "works" — verify the section's heading isn't hidden underneath the sticky header on arrival (check `scroll-padding-top` is set to the header's actual height).
- [ ] **shadcn CLI scaffold:** `init`/`add` ran cleanly — diff `globals.css`/`components.json` against the pre-CLI commit to confirm no existing custom breakpoints/tokens were silently dropped.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|-----------------|-----------------|
| Hit-testing silently broken after restyle (Pitfall 1) | LOW | Revert the specific `fill` change on the hull polygon/rotate circle to a real, non-`"none"` value matching the new palette; re-run the existing Phase-4-style manual drag/rotate UAT pass before re-merging |
| Half-wired dark theme (Pitfall 2) | LOW | Add `className="dark"` to the root `<html>` element in `app/layout.tsx`; no CSS restructuring needed if the `.dark` block already has correct values |
| Missing `@theme` registration for a custom color (Pitfall 3) | LOW | Add the missing `--color-<name>` declaration to the `@theme`/`@theme inline` block; no JSX changes needed once the token exists |
| Broken `Select` test after Radix swap (Pitfall 5) | LOW–MEDIUM | Rewrite the specific test assertions to the click+`findByRole("option")` pattern; add scoped jsdom polyfills to that test file only |
| Route-to-anchor scroll unreliable (Pitfall 6) | MEDIUM | Add `scroll-padding-top`; if native/Next.js scroll behavior still doesn't reliably land on `#gallery`, add a small client-side `scrollIntoView` fallback effect keyed on `window.location.hash` |
| shadcn CLI clobbered existing config (Pitfall 7) | LOW | `git diff`/`git checkout` the affected files back to the pre-CLI commit and manually re-apply only the shadcn-specific additions |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|---------------|
| 1. Silent SVG hit-testing regression | Sandbox | Manual browser drag+rotate UAT pass (not just `npm test`) before merging the Sandbox PR |
| 2. Half-wired light/dark toggle | Scaffolding | View the deployed/dev app with the OS set to light color-scheme; confirm `<html>` carries `dark` permanently |
| 3. Unregistered custom `@theme` color tokens | Scaffolding (shared tokens) / Sandbox (vessel-role colors) | Inspect generated CSS (devtools or build output) for each new `fill-*`/`bg-*` class actually used |
| 4. `@theme` vs `@theme inline` inconsistency | Scaffolding | All theme colors resolve correctly across every shadcn component after the token file is finalized, not just the ones tested first |
| 5. Radix `Select`/`Slider` breaks native-control tests | Sandbox | `ControlPanel.test.tsx` (and any new Slider tests) pass using the rewritten click/`findByRole` pattern, run against real Radix components, not mocks |
| 6. Route-to-anchor scroll/redirect gaps | Gallery | Manual test: fresh-tab navigation to old `/gallery` URL lands scrolled to `#gallery`, heading visible below the sticky header |
| 7. shadcn CLI clobbers existing config | Scaffolding | Diff review immediately after `init`/`add`; confirm no custom breakpoints/tokens lost |
| Hardcoded hex chart colors missed during restyle | Sandbox | Search for hex-literal color strings in `ChartPanel.tsx` returns nothing left unconverted |
| Vessel label text contrast (fill-current) | Sandbox | Visual check of give-way/stand-on/mutual badge legibility against the new dark chart background |

## Sources

- This repository: `.planning/PROJECT.md` (Key Decisions table — SVG hit-target fix, webpack `extensionAlias` fix, v1.1 locked decisions), `src/components/sandbox/ChartPanel.tsx`, `src/components/sandbox/hooks/useHullDrag.ts`, `src/components/sandbox/hooks/useRotateHandleDrag.ts`, `src/components/sandbox/ControlPanel.tsx`, `src/components/sandbox/ControlPanel.test.tsx` (line 132, `userEvent.selectOptions`), `src/components/sandbox/ChartPanel.test.tsx` (per-file `@vitest-environment jsdom` + `MockResizeObserver` pattern), `vitest.config.ts` (global `environment: "node"`), `app/gallery/page.tsx`, `app/page.tsx` — HIGH confidence, directly inspected
- Context7 `/shadcn-ui/ui` theming/manual-install docs — default `:root`/`.dark`/`@theme inline` scaffold shape — HIGH confidence
- Context7 `/websites/tailwindcss` (`docs/dark-mode`, `docs/functions-and-directives`, `docs/adding-custom-styles`) — `@custom-variant dark`, `@theme` directive semantics — HIGH confidence
- [shadcn/ui — Tailwind v4](https://ui.shadcn.com/docs/tailwind-v4) — MEDIUM-HIGH confidence, official docs
- [Shadcnblocks — Updating shadcn/ui to Tailwind 4](https://www.shadcnblocks.com/blog/tailwind4-shadcn-themeing) — `@theme` vs `@theme inline` black/white color bug — MEDIUM confidence, single community source, internally consistent with Tailwind's own directive semantics
- [github.com/testing-library/user-event Discussion #1087](https://github.com/testing-library/user-event/discussions/1087) — `hasPointerCapture is not a function` — MEDIUM-HIGH confidence, first-party repo discussion
- [radix-ui/primitives Issue #1822 — Unable to open select with @testing-library/react](https://github.com/radix-ui/primitives/issues/1822) — MEDIUM-HIGH confidence, first-party repo issue
- [ClarityDev — Testing Select Components with React Testing Library](https://claritydev.net/blog/testing-select-components-react-testing-library) — click+`findByRole` pattern for Radix Select — MEDIUM confidence
- [shadcn/ui — Native Select](https://ui.shadcn.com/docs/components/radix/native-select) — MEDIUM-HIGH confidence, official docs, confirms a native-`<select>`-based alternative exists in the current registry
- [Next.js — redirects (next.config.js)](https://nextjs.org/docs/app/api-reference/config/next-config-js/redirects), version 16.2.10 docs, fetched directly — HIGH confidence, official docs (confirms path-only matching, 307/308 semantics; does not document fragment support explicitly, consistent with fragments being client-only per HTTP semantics)
- [vercel/next.js Issue #44295 — Next.js 13 Link not scrolling to anchor element](https://github.com/vercel/next.js/issues/44295) — MEDIUM-HIGH confidence, first-party repo issue, still-open class of problem
- [vercel/next.js Discussion #13804 — replace url hash without scrolling](https://github.com/vercel/next.js/discussions/13804) — MEDIUM confidence, corroborating context on hash-scroll behavior gaps

---
*Pitfalls research for: shadcn/ui + Tailwind v4 dark-only redesign of an existing interactive-SVG Next.js app (COLREGS Navigator v1.1)*
*Researched: 2026-07-18*
