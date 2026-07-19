# Requirements: COLREGS Navigator — v1.2 Tech Debt & Stabilization

**Defined:** 2026-07-19
**Core Value:** Given any two-vessel encounter, correctly classify it under COLREGS and clearly explain — not just assert — which vessel must give way and why.

This milestone is a tech-debt/hygiene milestone, not a new-feature milestone. No user-facing behavior changes and no changes to domain logic outcomes — `classifyEncounter()` and all COLREGS rule outputs must be byte-identical before and after every change here. The goal is to demonstrate professional engineering hygiene (clean lint, clean file structure, clean comment/commit history) as a portfolio signal to a tech lead or interviewer reviewing the repo. Source of truth for scope: `.planning/research/SUMMARY.md` (4 research docs: STACK, FEATURES, ARCHITECTURE, PITFALLS).

## v1 Requirements

### Lint Tooling

- [x] **LINT-01**: ESLint is installed and configured via flat config (`eslint.config.mjs`), using `@next/eslint-plugin-next`'s `core-web-vitals` flat-config export directly — not via `eslint-config-next`, which was found during execution to crash at module-load time (`Cannot read properties of undefined (reading 'Cjs')`) against this project's locked TypeScript 7.0.2 (tsgo) compiler, since it transitively requires `typescript-eslint`. Required because Next.js 16 removed the `next lint` command entirely, and because `eslint-config-next` is currently incompatible with tsgo (verified: no published `typescript-eslint` version, including `canary`, supports TypeScript ≥6.1 as of this writing) — Done Phase 10 Plan 01
- [x] **LINT-02**: TypeScript files (`.ts`/`.tsx`) are parsed by ESLint via `@babel/eslint-parser` (syntax-only stripping, no type information) rather than `@typescript-eslint/parser` — `@typescript-eslint/parser` was found during execution to crash on any `.ts`/`.tsx` parse attempt against TypeScript 7.0.2 (tsgo), and no published `typescript-eslint` version supports it yet. Type safety continues to be enforced separately via the existing `npm run typecheck` (`tsc --noEmit`) script, which is unaffected by this ESLint-level limitation. Implementation note: `@babel/preset-typescript`/`@babel/preset-react` are installed but the actual syntax stripping is wired via `@babel/eslint-parser`'s raw `parserOpts.plugins: ["typescript", "jsx"]`, since `@babel/eslint-parser@8`'s `babelrc:false`/`configFile:false` fast path ignores `babelOptions.presets` entirely (discovered during Phase 10 Plan 01 execution) — Done Phase 10 Plan 01
- [x] **LINT-03**: `eslint-plugin-better-tailwindcss` is configured for Tailwind v4-aware deprecated/canonical class-name detection, so future regressions of the kind fixed in TWFX-01/02 are caught automatically going forward — Done Phase 10 Plan 02
- [x] **LINT-04**: `@vitest/eslint-plugin` is configured, scoped via `files` to test globs only, for Vitest-specific correctness rules — Done Phase 10 Plan 02
- [x] **LINT-05**: A `npm run lint` script is wired into `package.json` alongside the existing `dev`/`build`/`test`/`typecheck` scripts — Done Phase 10 Plan 01
- [x] **LINT-06**: The full codebase reaches a lint-clean baseline (zero errors) via `eslint --fix` and `eslint --fix --suppress-all`, never via mass-disabling or downgrading rules to reach a green run — Done Phase 10 Plan 03
- [x] **LINT-07**: A `no-restricted-imports` rule enforces the project's documented architecture boundary — `src/domain/` must never import from `src/server/`, Next.js, tRPC, or Prisma — Done Phase 10 Plan 02
- [x] **LINT-08**: Custom `no-restricted-syntax` rules operationalize two existing CLAUDE.md conventions: no stale Phase/Plan/REQ-ID references in comments, and no raw CSS-as-template-literal strings in component files — Done Phase 10 Plan 02

### Tailwind Deprecated Class-Name Fixes

- [ ] **TWFX-01**: `outline-none` is replaced with `outline-hidden` in the 4 flagged files (`button.tsx`, `select.tsx`, `Header.tsx`, `GalleryCard.tsx`) — these are semantically different utilities in Tailwind v4, not synonyms, so leaving `outline-none` unchanged silently ships an accessibility regression
- [ ] **TWFX-02**: Bare `rounded` is replaced with `rounded-sm` in the 2 flagged files (`SandboxContainer.tsx`, `ChartPanel.tsx`), matching Tailwind v4's renamed scale
- [ ] **TWFX-03**: Both fixes are applied by hand, file-by-file, scoped only to actual `className` Tailwind usages — not a blanket find-replace, since this codebase contains real false-positive traps (`"Grounded in "` UI copy, a "rounded to clean numbers" code comment)
- [ ] **TWFX-04**: Manual browser verification confirms no visual or accessibility regression in Hero, Header, Gallery, and Sandbox after the class-name fixes — jsdom cannot verify visual/paint output

### Sandbox Refactor

- [ ] **RFCT-01**: `ChartPanel.tsx`'s pure geometry constants, `wedgePath()`, and `buildGridLineSegments()` are extracted into `chart-panel-geometry.ts`, following the same pure-module pattern already proven in `hero-preview-geometry.ts`/`static-chart-geometry.ts`, with zero behavior change
- [ ] **RFCT-02**: `ChartPanel.tsx`'s per-render derivation logic is extracted into a `deriveChartOverlayState()` function in `chart-panel-derivation.ts`
- [ ] **RFCT-03**: Decorative chart chrome and resize observation are extracted into `ChartBackdrop.tsx` and `hooks/useContainerSize.ts`
- [ ] **RFCT-04**: `SandboxContainer.tsx`'s state machine (`applyVesselUpdate`, chip/reset/save handlers) is extracted into a `useSandboxState()` hook, preserving Rule 13(d) hysteresis behavior exactly
- [ ] **RFCT-05**: `VesselGroup.tsx` (hull polygon, rotate-handle circle, and the `pointerEvents="none"` badge overlay) is extracted last, as a single verbatim cut-paste — this exact code has caused two prior hit-testing regressions in this project (Phase 4, Phase 8), so it is moved as one atomic unit, not incrementally rewritten
- [ ] **RFCT-06**: Zero regression to drag-to-reposition/drag-to-rotate hit-testing behavior after the `VesselGroup.tsx` extraction, verified via the existing point-in-polygon regression check plus manual drag/rotate testing of both vessels at heading 0 in a real browser
- [ ] **RFCT-07**: `ChartPanel.tsx` and `SandboxContainer.tsx` both land under this project's established ~150-200 line file-length convention after extraction
- [ ] **RFCT-08**: All existing Vitest/RTL tests continue passing, updated only for import-path changes where files moved — not for behavior changes

### Comment Cleanup

- [ ] **CMNT-01**: All comments referencing Phase/Plan/REQ-IDs are rewritten by hand, one comment at a time, to preserve their substantive WHY content while removing the rotting identifier — not via a mechanical regex strip, since these IDs are woven into explanatory sentences rather than standalone tags in this codebase
- [ ] **CMNT-02**: A broader re-grep (beyond the strict numeric Phase/Plan/REQ-ID pattern used to originally scope this milestone) is run to catch any additional stale references, since the original count is known to be an undercount

## v2 Requirements

Deferred to a future milestone (see `.planning/research/FEATURES.md` for full rationale):

- **CI-01**: GitHub Actions workflow running lint + typecheck + test + build on every PR, with a status badge in the README — this milestone's `npm run lint` script is the explicit prerequisite for this, not part of it
- **HOOKS-01**: Husky + lint-staged pre-commit hooks — no value with a single contributor; pairs naturally with CI, not worth adding ahead of it
- **DOCS-CONTRIB-01**: `CONTRIBUTING.md` — no external contributors exist or are planned for this portfolio project
- **FMT-01**: Repo-wide Prettier reformatting pass — if pursued at all, should scope to new/touched files only, never a blanket reformat commit
- **RFCT-V2-01**: `ChipRow.tsx` extraction and a `SandboxContainer` header-block split — lower-value polish beyond the core 5 extractions, deferred
- **RSON-V2-01**: ambiguous/edge-case scenarios in the curated gallery (near-boundary head-on/crossing, Rule 17(a)(ii) doubt situations) — carried forward from v1.0/v1.1
- **SCEN-V2-01**: auto-generated social preview (OG) image per shared scenario — carried forward from v1.0/v1.1

## Out of Scope

| Feature | Reason |
|---------|--------|
| GitHub Actions CI / status badge | Locked out of scope per PROJECT.md; this milestone's `npm run lint` is the explicit prerequisite, not the CI wiring itself |
| Husky + lint-staged pre-commit hooks | No value with one contributor; would read as cargo-culting for a solo portfolio repo |
| `CONTRIBUTING.md` | No external contributors exist or are planned |
| Repo-wide Prettier reformat | A blanket reformat commit would bury the real hygiene signal (lint-clean baseline) in unrelated whitespace diffs |
| `typescript-eslint` `strict`/`strict-type-checked` tiers | Explicitly unstable under semver and too noisy for a first-pass retrofit; reconsider as a dedicated future "raise the bar" milestone |
| Any new user-facing features | This is a stabilization milestone — `src/domain/` outputs and all existing UI behavior must be unchanged |
| `ChipRow.tsx` extraction / `SandboxContainer` header-block split | Lower-value polish beyond the 5 core extractions identified by research; deferred to keep this milestone's refactor scope tight |

## Traceability

Populated by roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| LINT-01 | Phase 10 | Done (Plan 01) |
| LINT-02 | Phase 10 | Done (Plan 01) |
| LINT-03 | Phase 10 | Done (Plan 02) |
| LINT-04 | Phase 10 | Done (Plan 02) |
| LINT-05 | Phase 10 | Done (Plan 01) |
| LINT-06 | Phase 10 | Done (Plan 03) |
| LINT-07 | Phase 10 | Done (Plan 02) |
| LINT-08 | Phase 10 | Done (Plan 02) |
| TWFX-01 | Phase 11 | Pending |
| TWFX-02 | Phase 11 | Pending |
| TWFX-03 | Phase 11 | Pending |
| TWFX-04 | Phase 11 | Pending |
| RFCT-01 | Phase 12 | Pending |
| RFCT-02 | Phase 12 | Pending |
| RFCT-03 | Phase 12 | Pending |
| RFCT-04 | Phase 12 | Pending |
| RFCT-05 | Phase 12 | Pending |
| RFCT-06 | Phase 12 | Pending |
| RFCT-07 | Phase 12 | Pending |
| RFCT-08 | Phase 12 | Pending |
| CMNT-01 | Phase 13 | Pending |
| CMNT-02 | Phase 13 | Pending |

**Coverage:**
- v1 requirements: 22 total
- Mapped to phases: 22/22 ✓
- Unmapped: 0

---
*Requirements defined: 2026-07-19*
*Last updated: 2026-07-19 — traceability populated by roadmap creation: LINT-01–08 → Phase 10, TWFX-01–04 → Phase 11, RFCT-01–08 → Phase 12, CMNT-01–02 → Phase 13. 22/22 v1 requirements mapped, no orphans.*
