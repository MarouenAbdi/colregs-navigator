---
phase: 10-eslint-setup-lint-clean-baseline
plan: 02
subsystem: infra
tags: [eslint, tailwind, vitest, architecture-boundary, custom-rule, flat-config]

# Dependency graph
requires:
  - phase: 10-01
    provides: "Working eslint.config.mjs flat config (@next/eslint-plugin-next core-web-vitals + Babel-parser TS/JSX syntax parsing), npm run lint/lint:fix scripts"
provides:
  - "eslint-plugin-better-tailwindcss@4.6.1 wired repo-wide (entryPoint: app/globals.css), catching deprecated/non-canonical Tailwind v4 class names"
  - "@vitest/eslint-plugin@1.6.23 wired, scoped to src/**/*.test.{ts,tsx} only"
  - "src/domain/ architecture-boundary no-restricted-imports rule (blocks src/server/, Next.js incl. deep subpaths, tRPC, Prisma)"
  - "max-lines warn nudge (200 lines) scoped to src/domain/**"
  - "eslint-rules/no-stale-id-comments.mjs local custom rule, repo-wide, catching stale Phase/Plan/REQ-ID comment references"
  - "Content-gated raw-CSS-as-template-literal no-restricted-syntax rule, scoped to src/components/**/*.tsx and app/**/*.tsx"
affects: [10-03-lint-clean-baseline]

# Tech tracking
tech-stack:
  added: ["eslint-plugin-better-tailwindcss@4.6.1", "@vitest/eslint-plugin@1.6.23"]
  patterns:
    - "Local repo-local ESLint rule via plugins.local.rules (ESLint's own flat-config replacement for the deprecated --rulesdir flag), for conventions (stale-ID comments) with no existing core/plugin rule"
    - "Content-gated no-restricted-syntax selectors (esquery attribute predicates on TemplateElement.value.raw) rather than a bare TemplateLiteral match, to avoid flagging CLAUDE.md's own sanctioned CSS-custom-property-via-template-literal pattern"
    - "Verifying custom/boundary lint rules end-to-end via `eslint --stdin --stdin-filename=<virtual path>` against invalid, clean, and sanctioned-control snippets, instead of committing permanent fixture files to the tree"

key-files:
  created: ["eslint-rules/no-stale-id-comments.mjs"]
  modified: ["eslint.config.mjs", "package.json", "package-lock.json"]

key-decisions:
  - "Used ESLint's documented `extends: [plugin.configs.recommended]` flat-config pattern (confirmed via Context7 /eslint/eslint) for eslint-plugin-better-tailwindcss, rather than manually spreading its config.recommended object -- matches the plugin authors' and ESLint's own documented integration path"
  - "no-restricted-imports domain-boundary rule scoped with three next.js glob variants (next, next/*, next/**) since a bare next/* only matches one path segment past 'next/' -- next/** is required so deeper subpaths like next/font/google are also caught"
  - "Raw-CSS no-restricted-syntax uses two selectors, both content-gated on TemplateElement.value.raw containing CSS-composition substrings (background-image/animation/gradient/:/;), specifically to avoid flagging CLAUDE.md's sanctioned `style={{ \"--rotation\": `${angle}deg` }}` pattern -- a bare TemplateLiteral selector would have created exactly the eslint-disable-tempting false positive CLAUDE.md's own convention exists to prevent"

patterns-established:
  - "Repo-local custom ESLint rules live in eslint-rules/*.mjs and are wired into eslint.config.mjs via plugins.local.rules -- the pattern to follow for any future CLAUDE.md convention that needs mechanical enforcement with no existing core/plugin rule"

requirements-completed: [LINT-03, LINT-04, LINT-07, LINT-08]

# Metrics
duration: 25min
completed: 2026-07-19
---

# Phase 10 Plan 02: Tailwind/Vitest Plugins, Architecture Boundary, and Custom Rules Summary

**Layered eslint-plugin-better-tailwindcss + @vitest/eslint-plugin onto Plan 01's base config, added a src/domain/ architecture-boundary no-restricted-imports rule (blocking src/server/, Next.js incl. deep subpaths, tRPC, Prisma), and shipped two new custom rules (a local stale-Phase/Plan/REQ-ID-comment rule and a content-gated raw-CSS-as-template-literal rule) -- all verified end-to-end via `eslint --stdin` against invalid, clean, and sanctioned-control snippets, with zero permanent fixture files added to the tree.**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-07-19T18:36:00+01:00
- **Completed:** 2026-07-19T18:40:00+01:00
- **Tasks:** 3 (all auto)
- **Files modified:** 5 (package.json, package-lock.json, eslint.config.mjs modified; eslint-rules/no-stale-id-comments.mjs created)

## Accomplishments
- Installed `eslint-plugin-better-tailwindcss@4.6.1` (repo-wide via `extends: [configs.recommended]`, `entryPoint: "app/globals.css"`) and `@vitest/eslint-plugin@1.6.23` (scoped to `src/**/*.test.{ts,tsx}`, matching `vitest.config.ts`'s own `test.include` glob exactly)
- Confirmed via `--print-config` diff that Vitest rules apply only to test files and never leak into non-test components, while Tailwind rules apply repo-wide
- Added a `no-restricted-imports` rule scoped to `src/domain/**/*.{ts,tsx}` blocking `src/server/`, Next.js (including deep subpaths like `next/font/google`, via a `next/**` glob), `@trpc/*`, and Prisma imports -- turning CLAUDE.md's documented architecture boundary into a lint-enforced one; confirmed zero new baseline violations on the existing `src/domain/` tree
- Added `max-lines` at `warn` (200 lines) scoped to `src/domain/**` as a soft proxy nudge for the split-computation-from-presentation convention
- Created `eslint-rules/no-stale-id-comments.mjs`, a repo-local custom rule (registered via `plugins.local.rules`) catching stale Phase/Plan/REQ-ID comment references, including a broadened regex covering short requirement-code tokens without a `REQ-` prefix (e.g. `GAL-03`) and bare parenthetical phase/plan references (e.g. `(blocking, 04-01)`) -- both phrasings confirmed live in this repo's own `next.config.ts`/`vitest.config.ts` comments
- Added a content-gated `no-restricted-syntax` rule (scoped to `src/components/**/*.tsx` and `app/**/*.tsx`) flagging raw CSS composed as template-literal strings, deliberately narrow enough to not flag CLAUDE.md's sanctioned `style={{ "--rotation": \`${angle}deg\` }}` pattern
- Verified all three custom/boundary rules end-to-end via `eslint --stdin` -- 3 invalid snippets (exit 1, correct rule ID each), 1 broadened-pattern invalid snippet (exit 1), 1 sanctioned-pattern control (exit 0, no false positive), and 3 clean-snippet controls (exit 0 each) -- see Verification Evidence below
- Re-ran `npm run lint` after each task; confirmed it still runs to completion with no parser crash across all three commits

## Task Commits

Each task was committed atomically:

1. **Task 1: Install and wire Tailwind v4-aware and Vitest-specific plugin rules** - `78a62fc` (feat)
2. **Task 2: Architecture-boundary no-restricted-imports rule and max-lines warn nudge** - `8a26488` (feat)
3. **Task 3: Local stale-ID-comment rule, raw-CSS no-restricted-syntax, and end-to-end stdin verification** - `d8aab46` (feat)

**Plan metadata:** (this commit, docs: complete plan)

## Files Created/Modified
- `eslint.config.mjs` - Added: better-tailwindcss `extends` block with `entryPoint` setting; vitest plugin block scoped to `src/**/*.test.{ts,tsx}`; `src/domain/**` block with `no-restricted-imports` (4 pattern groups) + `max-lines` warn; local-plugin registration + `local/no-stale-id-comments: "error"` (repo-wide); `no-restricted-syntax` block (2 selectors) scoped to `src/components/**/*.tsx` + `app/**/*.tsx`
- `eslint-rules/no-stale-id-comments.mjs` - New local ESLint rule module: `Program()` visitor over `context.sourceCode.getAllComments()`, regex-tests each comment against the broadened stale-ID pattern
- `package.json` / `package-lock.json` - Added 2 new devDependencies (`eslint-plugin-better-tailwindcss@4.6.1`, `@vitest/eslint-plugin@1.6.23`)

## Decisions Made
- Used ESLint's own documented `extends: [plugin.configs.recommended]` syntax (confirmed via Context7 `/eslint/eslint` docs, since `eslint-plugin-better-tailwindcss`'s own shipped README/docs did not include a full ready-made `eslint.config.mjs` snippet in the installed package) rather than manually spreading the plugin's `configs.recommended.rules`/`.plugins` -- this is ESLint's first-party-documented integration pattern for consuming a plugin's bundled config object directly.
- Confirmed both plugins' exact `configs`/`rules` export shapes via a quick `node -e "import(...)"` inspection before wiring, rather than trusting research-doc snippets blindly, since Plan 01's own deviation log documented a prior instance of a plan's exact recipe silently no-oping against the real installed package version.

## Deviations from Plan

None - plan executed exactly as written. The plan's research/STACK.md snippet for `better-tailwindcss` used a slightly different shorthand (`extends: [eslintPluginBetterTailwindcss.configs.recommended]` was the plan's own instruction, matching what was implemented); no substantive deviation.

## Issues Encountered

One verification-only wrinkle, resolved without any code change: the plan's own "clean control" stdin check for the raw-CSS rule (Task 3) initially used a JSX snippet with `className="foo"` in this session's first attempt, which tripped an *unrelated* `better-tailwindcss/no-unknown-classes` violation (since `"foo"` is not a real Tailwind class) -- not a false positive of the raw-CSS rule itself, but it obscured a clean exit-0 result. Re-ran using the plan's own literally-suggested clean snippet (`export const z = 1;`, no JSX at all) for all three control-file paths, which produced exit 0 as expected across all three. No config or rule change was needed; this was purely a test-snippet correction during verification, not a deviation from the plan's shipped code.

## User Setup Required

None - no external service configuration required.

## Verification Evidence

All commands run against the real installed `eslint.config.mjs` via `eslint --stdin`:

| # | Check | Snippet | Filename | Exit | Rule ID in output |
|---|-------|---------|----------|------|--------------------|
| 1 | Domain-boundary invalid | `import { db } from "@/server/db/client.js";` | `src/domain/colregs/__verify__.ts` | 1 | `no-restricted-imports` |
| 2 | Stale-ID invalid (original) | `// Phase 3 fix applied here` | `src/domain/geometry/__verify__.ts` | 1 | `local/no-stale-id-comments` |
| 2b | Stale-ID invalid (broadened) | `// GAL-03: ...` + `// Rule 3 (blocking, 04-01): ...` | `src/domain/geometry/__verify_broadened__.ts` | 1 | `local/no-stale-id-comments` (both lines flagged) |
| 3 | Raw-CSS invalid | `style={\`background-image: linear-gradient(#000,#fff)\`}` | `src/components/shared/__verify__.tsx` | 1 | `no-restricted-syntax` |
| 3b | Raw-CSS sanctioned control | `style={{ "--rotation": \`${angle}deg\` }}` | `src/components/shared/__verify_sanctioned__.tsx` | 0 | (none -- no false positive) |
| C1 | Clean control (domain-boundary path) | `export const z = 1;` | `src/domain/colregs/__clean1__.ts` | 0 | (none) |
| C2 | Clean control (stale-ID path) | `export const z = 1;` | `src/domain/geometry/__clean2__.ts` | 0 | (none) |
| C3 | Clean control (raw-CSS path) | `export const z = 1;` | `src/components/shared/__clean3__.tsx` | 0 | (none) |

Additional checks:
- `npx eslint src/domain --format json` reports zero `no-restricted-imports` errors on the existing tree (no new baseline debt).
- `npx eslint --print-config` diffs confirm `vitest/*` rules present only on `src/domain/geometry/bearing.test.ts`, absent on `src/components/hero/Hero.tsx`; `better-tailwindcss/*` rules present on `app/page.tsx`.
- `npm run lint` (full repo) runs to completion after all three commits with no parser crash. New violations surfaced are all pre-existing baseline debt this plan's rules newly detect (expected, explicitly deferred to Plan 03): `vitest/no-conditional-expect` in several `src/domain/**/*.test.ts` files (conditional-branch test assertions predating this plan), `local/no-stale-id-comments` in `next.config.ts`, `vitest.config.ts`, `vitest.setup.ts`, and `src/server/db/scenario-repository.test.ts` (the exact stale-ID comments identified in PROJECT.md's milestone scoping), and `max-lines` warnings on 3 domain files already over 200 lines. Zero new `no-restricted-imports` errors (confirmed no new architecture-boundary violations).

## Next Phase Readiness
- All four of this plan's new rule categories (Tailwind, Vitest, domain-boundary, stale-ID/raw-CSS) are active and independently verified; `eslint.config.mjs` is ready for Plan 03 to resolve the full lint-clean baseline
- Plan 03 inherits a larger, more precisely-scoped set of known violations than Plan 01 alone surfaced: Tailwind deprecated-class findings, `vitest/no-conditional-expect` findings, stale-ID comment findings (matching PROJECT.md's pre-scoped list), and `max-lines` warnings on 3 files -- all expected and explicitly in Plan 03's scope, none newly introduced as unexpected debt
- No blockers

---
*Phase: 10-eslint-setup-lint-clean-baseline*
*Completed: 2026-07-19*
