# Project Research Summary

**Project:** COLREGS Navigator — v1.2 Tech Debt & Stabilization
**Domain:** Solo-built portfolio repo tooling/hygiene retrofit + internal component refactor (no new user-facing features)
**Researched:** 2026-07-19
**Confidence:** HIGH

## Executive Summary

This milestone is not a features milestone — it is a four-part tech-debt retrofit onto an existing, working, two-milestone-old codebase: (1) install ESLint for the first time (the repo currently has zero lint tooling), (2) fix 6 files' worth of deprecated Tailwind v4 class names, (3) decompose two oversized Sandbox components (`ChartPanel.tsx`, 560 lines; `SandboxContainer.tsx`, 280 lines) following the project's own already-proven "split computation from presentation" convention, and (4) manually clean up ~10 stale Phase/Plan/REQ-ID references embedded in domain comments. Research across all four tracks converges on one theme: every task in this milestone has a "fast, mechanical" way to do it and a "slow, manual" way to do it, and the mechanical shortcut is the wrong choice in every single case — bulk-disabling ESLint rules to get a green run, regex-stripping stale comment IDs, global find-replacing Tailwind class names, and blindly trusting `eslint --fix` inside `src/domain/` would each either defeat the milestone's own purpose or reintroduce a bug this project has already shipped and fixed once before.

The recommended approach is: adopt ESLint 10 + flat config (`eslint-config-next@16.2.10` + `typescript-eslint@8.64.0` at the `recommended`, non-type-checked tier — never `strict-type-checked`) and use ESLint's native `--fix --suppress-all` bulk-suppression workflow to reach a lint-clean baseline without disabling any rule; layer in two zero-dependency, high-signal differentiators (`no-restricted-imports` enforcing the `src/domain/` architecture boundary, and custom `no-restricted-syntax` rules operationalizing the stale-ID and raw-CSS-string conventions already documented in CLAUDE.md). For the Sandbox refactor, extract pure geometry/derivation modules first (zero risk) and move the hit-testing JSX (`VesselGroup`, containing the hull polygon, rotate handle, and the `pointerEvents="none"` badge overlay) last, as a single atomic verbatim cut-paste — this exact code has already caused two separate regressions in this project's history (Phase 4, Phase 8), and a structural refactor is exactly the kind of change likely to cause a third. For Tailwind fixes and comment cleanup, both must be done by hand, file-by-file/comment-by-comment — this codebase already contains concrete false-positive traps for any automated pass (`"Grounded in "` UI copy, "rounded to clean numbers" in a comment, stale IDs woven into substantive WHY sentences rather than standalone tags).

The key risk across the whole milestone is silent, untested drift: `eslint --fix` running unreviewed against `src/domain/` could reverse an intentional formatting exception or nudge a boundary-condition comparison; a refactor could drop a `pointerEvents="none"` attribute with no compiler error; a Tailwind rename could ship an accessibility regression jsdom cannot detect. Mitigation is procedural in every case — two-pass autofix (non-domain reviewed lightly, domain reviewed line-by-line against the existing Rule-13-overrides-Rule-18 regression test), re-running/adding the point-in-polygon hit-testing check plus manual drag verification, and mandatory manual browser verification for any Tailwind class-name change (this stack's test suite is structurally jsdom-based and cannot verify visual/paint output).

## Key Findings

### Recommended Stack

No new runtime dependencies — this milestone is entirely devDependency additions on top of the already-locked core stack (Next.js 16.2.10, React 19.2.7, TypeScript 7.0.2/tsgo, Tailwind 4.3.3, tRPC 11, Prisma 7, Zod 4, Vitest 4 + RTL, all previously locked and not re-researched). Next.js 16 removed `next lint` entirely, so ESLint must be invoked directly via flat config.

**Core technologies:**
- `eslint@10.7.0` — lint engine/CLI, flat-config runtime; required since Next.js 16 ships no linter of its own
- `eslint-config-next@16.2.10` — official Next.js flat-config export (`core-web-vitals` + `typescript` sub-exports), version-pinned to match this project's exact Next.js version
- `typescript-eslint@8.64.0` — TypeScript-aware rules at the `recommended` (non-type-checked) tier only; `recommended-type-checked` is a viable later upgrade, `strict`/`strict-type-checked` explicitly ruled out as too noisy for a first-pass retrofit and not stable under semver
- `eslint-plugin-better-tailwindcss@4.6.1` — Tailwind v4-aware deprecated/canonical class-name detection (`no-deprecated-classes`, `enforce-canonical-classes`); chosen over `eslint-plugin-tailwindcss` because the latter's migration rule targets v2→v3, not the v3→v4 direction this milestone needs
- `@vitest/eslint-plugin@1.6.23` — official Vitest correctness rules (`expect-expect`, `no-disabled-tests`, `no-focused-tests`), `files`-scoped to test globs only; the generic "ESLint+Vitest globals" gotcha does not apply here since this codebase already uses explicit `describe`/`it`/`expect` imports (`vitest.config.ts` sets `globals: false` deliberately)

### Expected Features

Framing: the reviewer is a hiring tech lead skimming the repo, not "users" — the tooling must be sized correctly for a solo portfolio repo, avoiding both under-scoping (no linter) and over-scoping (CI, git hooks, CONTRIBUTING.md for zero contributors), since an experienced reviewer notices both failure modes.

**Must have (table stakes):**
- ESLint installed + flat config (`eslint.config.mjs`), `eslint-config-next` + `eslint-config-next/typescript` — the single most visible gap in the repo today
- `npm run lint` script wired into `package.json`, documented alongside existing `dev`/`build`/`test`/`typecheck`
- Lint-clean baseline (zero errors) — the real cost driver of the milestone
- Stale `eslint` key removed from `next.config.ts` if present (confirmed not present in this repo)

**Should have (differentiators):**
- `no-restricted-imports` architecture-boundary rule enforcing "`src/domain/` never imports from `src/server/`/Next.js/tRPC/Prisma" — turns a written convention into a lint-enforced one; the single highest-signal differentiator available, zero new dependency
- Custom `no-restricted-syntax` rules for stale task/plan/REQ-ID comment patterns and raw-CSS-as-template-literal patterns — directly operationalizes two CLAUDE.md conventions, zero new dependency
- `max-lines` as a `warn`-level proxy nudge for the "split computation from presentation" file-length convention
- `typescript-eslint recommended-type-checked` upgrade, `.editorconfig`, README "Linting & Code Quality" section — genuine value, add if time allows after the base setup is lint-clean

**Defer (explicitly out of scope this milestone):**
- GitHub Actions CI + status badge — locked out of scope per PROJECT.md, this milestone is its explicit prerequisite
- Husky + lint-staged pre-commit hooks — no value with one contributor; pairs naturally with CI, not worth adding ahead of it
- `CONTRIBUTING.md` — no external contributors exist or are planned; fold useful content into the README instead
- Prettier repo-wide reformat — if pursued at all, scope to new/touched files only, never a blanket reformat commit
- `strict`/`strict-type-checked` tiers — reconsider only as an intentional future "raise the bar" milestone, not this first-pass setup

### Architecture Approach

The two oversized Sandbox files should be split following the project's own convention, already successfully applied twice elsewhere in the codebase (`hero-preview-geometry.ts`, `static-chart-geometry.ts` — both pure, zero-JSX modules). The riskiest code (actual pointer-capture/hit-testing logic) is already isolated in `useHullDrag.ts`/`useRotateHandleDrag.ts` with dedicated tests; what remains unextracted is pure geometry/constants, per-render derivation, decorative chrome, and the JSX that *wires* drag handlers onto the hull/rotate-handle shapes (`VesselGroup`).

**Major components to extract:**
1. `chart-panel-geometry.ts` — pure constants + `wedgePath()` + re-typed `buildGridLineSegments()` (zero risk, mirrors existing precedent exactly)
2. `chart-panel-derivation.ts` — new `deriveChartOverlayState()`, pulling per-render geometry derivation out of the component body (zero risk, no DOM/pointer code)
3. `ChartBackdrop.tsx` + `hooks/useContainerSize.ts` — decorative chrome and resize-observation, both low/zero risk
4. `hooks/useSandboxState.ts` — SandboxContainer's state machine (`applyVesselUpdate`, chip/reset/save handlers), zero SVG risk, must preserve Rule 13(d) hysteresis exactly
5. `VesselGroup.tsx` — hull polygon, rotate-handle circle, and the `pointerEvents="none"` badge overlay, moved **last**, as a single verbatim cut-paste (medium risk — this is the file containing both of the project's two previously-documented hit-testing regressions)

### Critical Pitfalls

1. **ESLint retrofit flood → mass rule-disabling** — a from-scratch lint install on an existing codebase will surface hundreds of violations; use `eslint --fix` then `eslint --fix --suppress-all` (writes a tracked `eslint-suppressions.json`) rather than setting rules to `"off"` or `"warn"` project-wide, which would defeat the entire hygiene signal this milestone exists to create.
2. **SVG hit-testing regression reoccurring a third time** — this exact bug class has already hit the project twice (Phase 4: padded invisible hit-shapes; Phase 8: missing `pointerEvents="none"` on a decorative overlay, caught only by an automated point-in-polygon check, not manual UAT). Treat the hull polygon, rotate-handle circle, and `pointerEvents="none"` overlay as one atomic unit during the refactor; re-run the geometric regression check and manually drag-test both vessels at heading 0.
3. **Comment cleanup deletes substantive WHY content** — the stale IDs found in this codebase are woven into explanatory sentences, not standalone tags; a regex strip would delete the load-bearing justification along with the ID. Requires manual, per-comment editing reviewed as prose, plus a broader re-grep (`this plan|this phase`) since the strict numeric-ID grep already missed at least one stale reference.
4. **Naive Tailwind v4 class-name find-replace corrupts non-Tailwind text / ships an unverifiable regression** — `outline-none`→`outline-hidden` and `rounded`→`rounded-sm` are not safe substring swaps in this codebase (`"Grounded in "` UI copy, "rounded to clean numbers" comment, many legitimate `rounded-lg`/`rounded-xl` classes). Requires scoping to `className` attributes only, editing the 6 flagged files by hand, and mandatory manual browser verification since jsdom cannot detect visual/accessibility regressions.
5. **Mechanical autofix drifts into an unreviewed domain-logic or intentional-formatting change** — `eslint --fix`, comment cleanup, and the refactor all touch `src/domain/`, the one directory this project treats as sacrosanct; the project has already shipped one real Rule 13/18 precedence bug from exactly this kind of casual touch. Run `eslint --fix` in two passes (broad outside `src/domain/`, line-by-line reviewed inside it), and protect the known intentional single-quote exception in `vessel-priority.ts`.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: ESLint Setup & Lint-Clean Baseline
**Rationale:** Must come first — every other phase's own dependency chain (FEATURES.md) requires the `npm run lint` script and a clean baseline to exist before further edits happen, and running suppression after other phases start editing files would suppress violations those phases then have to un-suppress or fix anyway (PITFALLS.md Pitfall 1).
**Delivers:** `eslint.config.mjs` (flat config: `eslint-config-next` core-web-vitals + typescript, `typescript-eslint` recommended, `eslint-plugin-better-tailwindcss`, `@vitest/eslint-plugin` scoped to test files), `npm run lint` script, stale `eslint` key removal (confirmed not present), lint-clean baseline via `--fix --suppress-all`, the `no-restricted-imports` domain-boundary rule, custom `no-restricted-syntax` rules for stale IDs and raw-CSS strings, `max-lines` warn.
**Addresses:** FEATURES.md's full P1 list plus the highest-value P2 differentiators (architecture boundary, custom rules).
**Avoids:** Pitfall 1 (flood/mass-disable) and half of Pitfall 5 (two-pass `eslint --fix`, domain files reviewed line-by-line, Rule 13/18 test re-confirmed).

### Phase 2: Tailwind Deprecated Class-Name Fixes
**Rationale:** A narrow, high-precision, entirely manual task, independent of the refactor's file structure; doing it right after Phase 1 means `eslint-plugin-better-tailwindcss` is already in place to catch any *future* regression, even though the 6 currently-known files must still be fixed by hand rather than relying on the plugin's autofix.
**Delivers:** `outline-none`→`outline-hidden` (4 files: `button.tsx`, `select.tsx`, `Header.tsx`, `GalleryCard.tsx`) and `rounded`→`rounded-sm` (2 files: `SandboxContainer.tsx`, `ChartPanel.tsx`), each edited individually with a manual browser check of Hero/Header/Gallery/Sandbox.
**Avoids:** Pitfall 4 (naive replace corrupting UI copy/comments, unverifiable visual/a11y regression).

### Phase 3: ChartPanel/SandboxContainer Decomposition Refactor
**Rationale:** Sequenced after Tailwind fixes since both touch `ChartPanel.tsx`/`SandboxContainer.tsx` directly — doing the smaller, higher-precision Tailwind fix first avoids compounding two risky simultaneous edits to the same files, and the refactor's own extraction order (research-confirmed) already sequences low-risk pure modules before the high-risk hit-testing JSX.
**Delivers:** `chart-panel-geometry.ts`, `chart-panel-derivation.ts`, `ChartBackdrop.tsx`, `hooks/useContainerSize.ts`, `hooks/useSandboxState.ts` extracted first (each gated by existing tests passing unmodified); `VesselGroup.tsx` extracted last as a verbatim cut-paste. Both target files land under the ~150-200 line convention threshold.
**Avoids:** Pitfall 2 (SVG hit-testing regression) via atomic extraction order, re-run/added point-in-polygon check, and manual drag verification at heading 0 for both vessels.

### Phase 4: Comment Cleanup
**Rationale:** Lowest-risk, most isolated task; sequenced last so it doesn't compound review complexity with the refactor's own file moves — though it touches `src/domain/` files not otherwise modified this milestone, so it has no real ordering dependency on Phases 1-3 and could in principle run in parallel if desired.
**Delivers:** ~10+ stale Phase/Plan/REQ-ID references (including at least one non-numeric miss caught by a broader re-grep) rewritten by hand, one comment at a time, preserving every substantive WHY clause.
**Avoids:** Pitfall 3 (deleting substantive WHY content via mechanical regex stripping).

### Phase Ordering Rationale

- ESLint setup is a hard prerequisite for everything else per FEATURES.md's own dependency graph (script + baseline must exist before other phases' edits are judged "lint-clean").
- Tailwind fixes and the refactor both center on the same two files (`ChartPanel.tsx`, `SandboxContainer.tsx`); doing the narrower, more mechanical-looking (but actually high-precision) Tailwind fix first avoids interleaving two independently risky changes in one diff.
- The refactor's internal extraction order (pure geometry → derivation → chrome/hooks → hit-testing JSX last) is itself research-confirmed and should be preserved inside Phase 3 rather than flattened into one commit.
- Comment cleanup has no structural dependency on the other three phases and is placed last mainly to avoid adding review noise to the higher-risk phases, not because of a technical blocker.

### Research Flags

This milestone's four research documents (STACK, FEATURES, ARCHITECTURE, PITFALLS) were already produced as project-specific deep research directly against this repo's files, official docs, and Context7 — not generic domain research. As a result:

Phases with standard patterns (skip additional research-phase):
- **Phase 1 (ESLint setup):** Exact package versions, flat-config shapes, and integration risks (Vitest globals, Tailwind plugin choice, typescript-eslint tier) are already fully confirmed in STACK.md/PITFALLS.md with primary-source citations.
- **Phase 2 (Tailwind fixes):** The exact 6 files, exact rename semantics, and false-positive traps are already enumerated in PITFALLS.md against this repo's actual grep output.
- **Phase 3 (Sandbox refactor):** ARCHITECTURE.md already provides exact target file list, function signatures, and a tested extraction order against the actual current file contents.
- **Phase 4 (Comment cleanup):** PITFALLS.md already quotes the actual comment text requiring editing.

No phase in this milestone is flagged as needing `/gsd:plan-phase --research-phase` — the research is unusually concrete and project-specific rather than general-domain, since all four researchers read this repo's own files directly.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All package/version claims verified via live `npm view`, Context7, and official Next.js/typescript-eslint docs this session — not training data |
| Features | HIGH (solo-vs-team judgments MEDIUM) | Next.js/typescript-eslint mechanics verified officially; the "what a solo portfolio repo should skip" calls are cross-checked against multiple community sources but are inherently project-context judgments, not documented facts |
| Architecture | HIGH | Based on direct inspection of both target files, their existing test suites, both already-extracted hooks, and the two prior successful applications of this project's own split convention |
| Pitfalls | HIGH | Grounded in this repo's actual files/greps (real comment text, real false-positive strings) plus official ESLint/Tailwind docs, not generic advice |

**Overall confidence:** HIGH

### Gaps to Address

- `eslint-config-prettier`'s exact version was not verified this session (STACK.md flags "verify at install time") — irrelevant unless Prettier is actually adopted, which is correctly scoped as optional/deferred.
- Whether to pursue the `typescript-eslint recommended-type-checked` upgrade within this milestone or defer it is left as a "should have" tier — decide during Phase 1 planning based on how noisy the base `recommended` pass turns out to be.
- PITFALLS.md notes the original "10 stale comments" scoping count may be an undercount (a non-numeric stale reference was found via a looser grep) — Phase 4 planning should budget for a broader re-grep rather than trusting the original count as exhaustive.
- No CI exists yet to make `npm run lint` an enforced gate — this is an explicit, locked non-goal for this milestone (deferred to a future milestone) and not a gap in this research, but worth flagging for future roadmap awareness.

## Sources

### Primary (HIGH confidence)
- [Next.js: ESLint Plugin config reference](https://nextjs.org/docs/app/api-reference/config/eslint) — official docs, `next lint` removal, flat-config setup, `eslint-config-next`/`eslint-config-next/typescript` exports
- Context7 `/typescript-eslint/typescript-eslint` — `recommended`/`recommended-type-checked`/`strict`/`strict-type-checked` tier definitions and stability guidance
- Context7 `/eslint/eslint` — `--fix --suppress-all`/`eslint-suppressions.json` bulk-suppression workflow
- `npm view` live registry lookups for `eslint`, `eslint-config-next`, `typescript-eslint`, `eslint-plugin-better-tailwindcss`, `@vitest/eslint-plugin`
- Tailwind CSS official upgrade guide — `outline-none`/`outline-hidden` semantic difference, `rounded`/`rounded-sm`/`rounded-xs` rename cascade
- Direct inspection of this repo's own files: `ChartPanel.tsx`, `SandboxContainer.tsx`, their test files, `useHullDrag.ts`/`useRotateHandleDrag.ts`, `hero-preview-geometry.ts`, `static-chart-geometry.ts`, `classify-encounter.ts`, `vessel-priority.ts`, `.planning/PROJECT.md` Key Decisions log
- `eslint-plugin-better-tailwindcss` README and `docs/parsers/tsx.md`, fetched directly

### Secondary (MEDIUM confidence)
- WebSearch cross-sections on solo-developer pre-commit hooks and CONTRIBUTING.md conventions — multiple independent community sources agree, but this is a project-context judgment rather than a documented fact
- `eslint-plugin-tailwindcss` GitHub rules directory and release notes — direct inspection but community (non-official) source

### Tertiary (LOW confidence)
- None flagged — all findings in this milestone's research were either officially verified or based on direct repo inspection

---
*Research completed: 2026-07-19*
*Ready for roadmap: yes*
