# Milestones

## v1.1 UI Redesign (shadcn) (Shipped: 2026-07-19)

**Phases completed:** 4 phases, 14 plans, 31 tasks

**Key accomplishments:**

- shadcn/ui installed (Radix base) with a single locked dark-token palette, Geist/Geist Mono fonts, and a sticky Header/Footer page shell wired into `app/layout.tsx` for every route.
- User confirmed dark-only rendering, responsive Header collapse, Geist font application, Source link behavior, and Footer copy all match spec with no console errors
- Net-new Hero section (headline/CTAs/trust-note) above the Sandbox, with a fully static SVG "Live classification" preview card whose RANGE/BEARING/CPA/Rule-15/verdict numbers are computed by a real `classifyEncounter()`/`bearing()`/`cpa()` call against a fixed, verified fixture.
- Human verification confirmed Plan 07-01's Hero section matches the design mock, is fully static, collapses correctly at both breakpoints, and its CTAs scroll-navigate cleanly with no console errors.
- Registered 7 missing dark-theme semantic tokens, vendored shadcn Select/Slider/Label, consolidated role-styling into vessel-role.ts, and built 4 pure derivation modules (6 chip fixtures verified against the real classifyEncounter(), instrument readouts, status-pill copy, reasoning-trail tag helpers) that every Wave 2/3 Sandbox component will import.
- Re-themed ChartPanel.tsx's remaining raw hex literals to semantic Tailwind tokens, consolidated its hull-fill/role-badge maps into vessel-role.ts, and added a proportionally-accurate "1 NM" scale-bar legend -- with zero changes to hull/rotate-handle hit-testing geometry or pointer handler wiring.
- Swapped ControlPanel.tsx's native `<input type="number">`/`<select>` for shadcn `Slider`/`Select` inside a per-vessel `Card` with a letter-chip + role-badge header row, and fully rewrote `ControlPanel.test.tsx`'s interaction assertions for the Radix primitive click/keyboard pattern, preserving the exact `onVesselSpeedChange`/`onVesselTypeChange` call contract.
- Split the single `ReasoningPanel` aside into 3 design-matching cards -- `VerdictBanner` (rule badge + standalone title/description + role badges), `InstrumentReadouts` (2x2 grid + status pill), `ReasoningTrail` (dynamic-length numbered trail with position-derived tags) -- each independently tested with zero behavior regression.
- Restyled SandboxContainer's header/layout and composed the 3 split reasoning cards into the design's responsive 2-col/full-width grid, wired the 6-chip preset row through the existing applyVesselUpdate/handleReset choke point, restyled CopyLinkButton to an icon button, and fully rewrote SandboxContainer.test.tsx (12/12 green) for the new markup -- closing out every remaining Wave 2 transitional typecheck error.
- Human-verified PASS for all 6 required checks (drag/rotate hit-testing, visual fidelity, chip-row correctness, Save/Reset, responsive breakpoints) after an interactive UAT session that surfaced and fixed 11 rounds of styling/layout drift between the initial restyle and the design -- including a live re-sync against a freshly updated Claude Design source imported mid-session.
- Rewrote the gallery's 6 curated Postgres rows (via 3 new domain fixtures, a corrected curatedScenarios array, and a Scenario.title/ruleLabel schema migration) so `gallery.list()` returns exactly the design's 6 labeled cards with no mirror-pair duplicate.
- Extracted Hero's reusable hull/heading-vector/midpoint SVG geometry into `src/components/shared/static-chart-geometry.ts` and built `GalleryPreviewChart.tsx`, a parametrized role-colored mini-chart with a per-card dynamic viewBox spanning the gallery's 1.0-10.0 NM vessel-pair range.
- Gallery section (6-card responsive grid) server-rendered on the home page below Sandbox, consuming Plan 01's curated data and Plan 02's GalleryPreviewChart; `/gallery` route removed in favor of a permanent redirect.
- Human-confirmed GAL-03 redirect/anchor-scroll behavior and GAL-01 responsive grid fidelity, plus 4 design-fidelity fixes found and resolved during the checkpoint

---
