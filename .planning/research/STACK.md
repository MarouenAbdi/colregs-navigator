# Technology Stack

**Project:** COLREGS Navigator — v1.2 Tech Debt & Stabilization (ESLint/lint-tooling setup)
**Researched:** 2026-07-19
**Confidence:** HIGH (all package/version/config claims verified via Context7, official Next.js docs, and live npm/GitHub source inspection this session — no training-data-only claims)

## Scope Note

This document **replaces** the prior `STACK.md` (v1.1 UI Redesign — shadcn/ui adoption research, dated 2026-07-18). That research is no longer the active decision surface; shadcn/ui is now a shipped, locked part of the stack (see `.planning/PROJECT.md` Constraints). This document covers ONLY the new decision this milestone introduces: lint/format tooling for a codebase that currently has zero lint tooling (no ESLint dependency, no config file, no Prettier/Biome). Existing stack (Next.js 16.2.10, React 19.2.7, TypeScript 7.0.2, Tailwind 4.3.3, shadcn/ui, tRPC 11, Prisma 7, Zod 4, Vitest 4 + RTL) is validated and locked — not re-researched here.

### CORRECTION (discovered during Phase 10 execution, 2026-07-19)

The `typescript-eslint@8.64.0` / `eslint-config-next` recommendation below is **wrong for this project** and was superseded mid-phase-10-execution. `typescript-eslint`'s peer dependency (`typescript: ">=4.8.4 <6.1.0"`, confirmed unchanged on the `canary` prerelease) does not cover this project's locked `typescript@7.0.2` (the tsgo Go-based compiler rewrite). `@typescript-eslint/parser` crashes at require-time (`Cannot read properties of undefined (reading 'Cjs')`, in `@typescript-eslint/typescript-estree/dist/create-program/shared.js`) because tsgo's package does not export the classic compiler internals (`ts.ModuleKind`, `ts.Extension`) that `typescript-estree` reads unconditionally at module load. This is not limited to the `typescript` sub-export — **`eslint-config-next`'s `core-web-vitals` sub-export also crashes**, since it transitively depends on `typescript-eslint` regardless of which export is used (confirmed via direct `require()` of both `dist/core-web-vitals.js` and `dist/typescript.js`).

**Corrected approach (user-approved):** bypass `eslint-config-next` entirely.
- Use `@next/eslint-plugin-next`'s own flat-config-native exports directly (`configs['core-web-vitals']` / `configs.recommended` — confirmed present and load cleanly standalone, zero TypeScript-package dependency, only depends on `fast-glob`).
- Parse `.ts`/`.tsx` files via `@babel/eslint-parser` + `@babel/preset-typescript` (syntax-stripping only, no type information, does not touch the `typescript` package's compiler API at all) instead of `@typescript-eslint/parser`. Confirmed via Context7 (`babeljs.io` docs): `requireConfigFile: false` + inline `babelOptions: { babelrc: false, configFile: false, presets: ['@babel/preset-typescript', ['@babel/preset-react', { runtime: 'automatic' }]] }` avoids needing a separate `babel.config.js`. Babel 8 (installed: `8.0.1`) auto-handles `.tsx` alongside a JSX preset with no `isTSX`/`allExtensions` flags (removed in v8).
- Type safety remains fully covered by the pre-existing `npm run typecheck` (`tsc --noEmit`) script — this ESLint-level limitation has no effect on actual type-checking, only on ESLint's own TS-aware lint rules (which are consequently out of scope this milestone; see corrected LINT-02 in REQUIREMENTS.md).
- `no-restricted-imports`/`no-restricted-syntax` (LINT-07/LINT-08) are unaffected — both are core ESLint rules operating on any ESTree-compatible AST, including Babel's output.

The "Recommended Stack" table below (written before this correction) still accurately describes `eslint-plugin-better-tailwindcss` and `@vitest/eslint-plugin`, which have no TypeScript-compiler dependency and are unaffected.

## Context Established by Parallel Research (build on this, don't re-derive)

- Next.js 16 removed `next lint` entirely (`v16.0.0` changelog, re-confirmed directly this session against the official docs page). There is no fallback CLI command — ESLint must be invoked directly (`eslint .`) via a flat-config `eslint.config.mjs`. Any `eslint` key in `next.config.ts` would be dead config and should be deleted — this repo's `next.config.ts` (read directly) has no such key already, so there is nothing to remove here.
- `.eslintrc.*` (legacy config format) is not a candidate to consider — ESLint 9+/10+'s default and primary format is flat config, and this is a from-scratch install with no legacy config to migrate.
- PITFALLS.md's `eslint --fix --suppress-all` bulk-suppression workflow (for the first-adoption "flood" problem) and FEATURES.md's `no-restricted-imports`/`no-restricted-syntax` custom-rule recommendations are both already-completed research — not re-derived here.

## Recommended Stack

### Core Lint Toolchain

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `eslint` | `10.7.0` (current `latest` on npm, verified this session) | Lint engine, CLI, flat-config runtime | Required — Next.js 16 ships no linter of its own. v10 uses flat config (`eslint.config.mjs`) as its default and primary format. |
| `eslint-config-next` | `16.2.10` (current `latest`, pinned to match this project's exact Next.js version) | Next.js's own recommended flat-config export — bundles `@next/eslint-plugin-next` + `eslint-plugin-react`/`eslint-plugin-react-hooks` recommended rule sets | Official Next.js package for exactly this purpose (`nextjs.org/docs/app/api-reference/config/eslint`, `lastUpdated: 2025-11-10`, version-pinned to `16.2.10`). Ships flat-config-compatible sub-exports (`eslint-config-next/core-web-vitals`, `eslint-config-next/typescript`) — see exact import syntax below. |
| `typescript-eslint` | `8.64.0` (current `latest`, verified this session) | TypeScript-aware ESLint rules, flat-config helper (`tseslint.config`) | Locked TypeScript core technology (7.0.2/tsgo) needs TypeScript-specific lint rules, or the config reads as an oversight on a fully-TS codebase. `eslint-config-next/typescript`'s own rules are themselves based on `@typescript-eslint/recommended` — installing the modern unified `typescript-eslint` meta-package (not the older split `@typescript-eslint/parser`+`@typescript-eslint/eslint-plugin` two-package install) is the current officially-documented path, useful now for its `tseslint.config()` helper and later for the `recommended-type-checked` upgrade tier FEATURES.md already scopes as a "should have." |

### Question 1 — Confirmed: `eslint-config-next` Flat-Config Export & Exact Import Syntax

**Yes**, `eslint-config-next@16.2.10` ships flat-config-compatible exports. Confirmed directly against `nextjs.org/docs/app/api-reference/config/eslint` (official docs, `lastUpdated: 2025-11-10`, version-pinned to this project's exact `16.2.10`). Two relevant sub-exports:

- `eslint-config-next/core-web-vitals` — base Next.js + React + React Hooks rules, with Core-Web-Vitals-impacting rules upgraded from warn to error. Recommended entry point for "most projects" per Next's own docs.
- `eslint-config-next/typescript` — adds TypeScript-specific rules (based on `@typescript-eslint/recommended`) on top of either base config. Additive — use alongside `core-web-vitals`, not standalone.

Exact `eslint.config.mjs` shape (official example, adapted with `nextTs` added since this project is 100% TypeScript):

```js
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    // eslint-config-next's own default ignores
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
```

`defineConfig`/`globalIgnores` are ESLint's own first-party flat-config authoring helpers, exported from the `eslint/config` subpath of the `eslint` package itself — not a separate dependency.

### Question 2 — Confirmed: `typescript-eslint` Flat-Config Setup (Recommended Tier, Not Strict-Type-Checked)

Current version: `typescript-eslint@8.64.0` (verified via `npm view`, matches the version already cited in this milestone's PITFALLS.md). Flat-config setup uses the `tseslint.config()` helper (confirmed via Context7 `/typescript-eslint/typescript-eslint`):

```js
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
);
```

Confirmed detail directly relevant to risk assessment: **`tseslint.configs.recommended` (the non-type-checked tier) does not require `parserOptions.project`/a TypeScript "program" to be configured** — typescript-eslint's own integration-test fixture is explicitly titled to prove "the recommended config does not require a program to be specified to ensure a fast and simple initial setup." Practical effect for this milestone: adopting `recommended` now carries zero risk of type-aware-linting slowness or `tsconfig.json` `include`/`exclude` mismatches — that risk class is deferred entirely to if/when `recommended-type-checked` is added later (already scoped in FEATURES.md as a later-tier candidate, with `strict-type-checked` explicitly ruled out there as too noisy for a first pass).

**Integration note for this project specifically:** since `eslint-config-next/typescript` already wraps `@typescript-eslint/recommended`, the practical setup is to let `eslint-config-next/typescript` be the sole TS-rules source for the base pass — do not additionally hand-wire a separate `tseslint.config(... tseslint.configs.recommended)` block in the same config, which would register overlapping/conflicting rule sets for the same concern. Reach for `typescript-eslint`'s own `tseslint.config()` API directly only when/if `recommended-type-checked` is adopted as the later upgrade (at which point it would likely replace, not stack on top of, `eslint-config-next/typescript`'s bundled TS rules).

### Question 3 — Tailwind v4 Deprecated/Stale Utility Class-Name Detection

The ecosystem is **not as fragmented here as the parallel PITFALLS.md pass flagged as an open risk** — that flag was a reasonable caution going in, but direct rule-level inspection this session found a plugin that concretely solves this milestone's exact stated need. Two real candidates were evaluated by reading their actual rule lists (not just their marketing descriptions):

| Plugin | Version | Tailwind v4 support | Flat config | Deprecated/renamed-class detection |
|---|---|---|---|---|
| `eslint-plugin-tailwindcss` (francoismassart) | `4.2.0` (current `latest` dist-tag) | Yes — this major version line is a ground-up rewrite exclusively for Tailwind v4 (peer dep `tailwindcss: ^4.0.0`, NOT `^3.x`; v3 support lives on separate `tw2`/`tw2beta` npm dist-tags). Confirmed via `npm view` peerDependencies and the package's own v4.0.3 release notes: "re-written from scratch...only compatible with Tailwind CSS v4.x.x." | Yes (`eslint: ^9.0.0 \|\| ^10.0.0` peer dep, `tailwind.configs["flat/recommended"]` export) | **No dedicated rule for this.** Its rule set (`classnames-order`, `no-contradicting-classname`, `no-custom-classname`, `enforces-shorthand`, `no-unnecessary-arbitrary-value`, `migration-from-tailwind-2`, ...) includes a `migration-from-tailwind-2` rule — that migrates Tailwind **v2→v3** naming, the wrong direction for this milestone's actual need (v3→v4 renames like `outline-none`→`outline-hidden`, `rounded`→`rounded-sm`/`rounded-xs`). Not the right tool for THIS specific problem despite otherwise supporting v4 syntax. |
| **`eslint-plugin-better-tailwindcss`** (schoero) — RECOMMENDED | `4.6.1` (current `latest`) | Yes, and explicitly version-aware: its own rule table marks each rule with `tw3`/`tw4` support columns. `no-deprecated-classes` ("Remove deprecated classes") and `enforce-canonical-classes` ("Enforce canonical class names") are both marked `tw4`-only, both autofix-capable, and both included in the plugin's default `recommended` config — no extra opt-in needed. | Yes — `eslint` is listed as an **optional** peer dep (`eslint: ^7.0.0 \|\| ^8.0.0 \|\| ^9.0.0 \|\| ^10.0.0`), alongside equally-optional `oxlint` support; ESLint integration is fully supported, which is what this project needs. | **Yes — direct answer to question 3.** Confirmed by fetching the plugin's own README rule table and its `docs/parsers/tsx.md` setup doc directly (not a secondary summary). |

**Recommendation: `eslint-plugin-better-tailwindcss`, not `eslint-plugin-tailwindcss`.** Beyond deprecated-class detection, it has a second concrete fit advantage for this exact codebase: it ships **built-in recognition of `cn`, `cva`, `clsx`, and `twMerge`/`twJoin`** as class-bearing call sites out of the box (confirmed in its own README "Utilities" list) — this project's `cn()` helper (built on `clsx` + `tailwind-merge`, both already dependencies per `package.json`) and `class-variance-authority` (`cva`) usage across `src/components/ui/*` are exactly the patterns it already recognizes without extra `settings` configuration.

Confirmed flat-config setup (adapted from the plugin's own `docs/parsers/tsx.md`, fetched directly — Tailwind v4 uses `entryPoint`, pointing at the CSS entry file, not a JS/TS config file):

```js
import eslintPluginBetterTailwindcss from "eslint-plugin-better-tailwindcss";

// merged into the same defineConfig([...]) array as the rest of eslint.config.mjs
{
  extends: [eslintPluginBetterTailwindcss.configs.recommended],
  settings: {
    "better-tailwindcss": {
      // Tailwind v4: point at the CSS entry file (this repo's is app/globals.css,
      // confirmed by reading it — it contains `@import "tailwindcss";`).
      entryPoint: "app/globals.css",
    },
  },
},
```

**Caveat for requirements-definition:** this plugin's Tailwind-v4-specific (`tw4`-column) rules are young — actively developed this year, per its own changelog activity. Budget for reviewing its findings rather than trusting 100% autofix blindly, consistent with PITFALLS.md's general "review every autofix in a first-adoption pass" guidance. Its practical role in this milestone is as a **regression-prevention net going forward** (catch the *next* stale-class introduction) — the 6 currently-known violation files (per `PROJECT.md`) should still be fixed by hand, per PITFALLS.md Pitfall 4's explicit no-naive-find-replace guidance; do not treat this plugin's autofix as a substitute for that manual, reviewed pass.

### Question 4 — ESLint 9/10 Flat Config vs. Vitest 4 Test Files

**Project-specific finding that overrides the generic advice:** this project's `vitest.config.ts` (read directly) sets `test.globals: false` explicitly, with an inline comment: *"explicit describe/it/expect imports — matches CLAUDE.md's 'no magic' persona."* Every test file already imports `describe`/`it`/`expect`/`afterEach` etc. directly from `"vitest"` (confirmed by reading `src/components/gallery/GalleryCard.test.tsx` and cross-checking others). **This means the commonly-cited ESLint+Vitest gotcha — needing a `languageOptions.globals` override block so `no-undef` doesn't flag bare `describe`/`it`/`expect` as undefined globals — does not apply to this codebase.** Those identifiers are real, statically-resolvable imports, not ambient globals; there is nothing for `no-undef` to misfire on.

There is still one real, separate integration worth wiring — a genuine test-quality addition, not a bug workaround: `@vitest/eslint-plugin` (current `latest`: `1.6.23`, verified via `npm view`; peer deps `eslint: >=8.57.0`, `typescript: >=5.0.0`, `vitest: *` — all satisfied by this project's `eslint@10.7.0`/`typescript@7.0.2`/`vitest@4.1.10`). This is the official `vitest-dev`-org plugin (scoped package name) — not to be confused with the unscoped, less-maintained `eslint-plugin-vitest` (resolved to a stale `0.5.4` via `npm view` this session, versus this package's actively-maintained `1.6.23`). It adds Vitest-specific correctness rules neither `eslint-config-next` nor `typescript-eslint` can cover, since neither has any awareness of Vitest's API surface — e.g. `expect-expect` (flag a test with no assertion), `no-disabled-tests`, `no-focused-tests` (catch an accidentally-committed `.only`). Confirmed flat-config setup (from the plugin's own README, fetched directly):

```js
import vitest from "@vitest/eslint-plugin";

// scoped only to test files — do not apply repo-wide
{
  files: ["src/**/*.test.{ts,tsx}"], // matches this project's actual vitest.config.ts `include` glob
  plugins: { vitest },
  rules: {
    ...vitest.configs.recommended.rules,
  },
},
```

Scoping this block with `files` (matching `vitest.config.ts`'s own `include: ["src/**/*.test.{ts,tsx}"]`) is what avoids the one real integration risk: registering Vitest-specific rules unscoped would apply them to files that never import Vitest at all, producing either silent no-ops or confusing findings. Always scope this plugin's block with `files`, never register it globally.

**Net answer to question 4:** no blocking incompatibility exists between ESLint 10's flat config and this project's Vitest 4 test files. The generic "add globals for describe/it/expect" advice found in general ESLint+Vitest writeups does not apply here, because this codebase's `globals: false` setting and explicit-import convention are already a deliberate, documented choice — not a gap to patch. The one real addition is `@vitest/eslint-plugin`'s `recommended` config, `files`-scoped to the test glob, for Vitest-specific correctness rules unrelated to the globals question.

### Formatting (Prettier) — Not Required for the Base Setup, Optional Later

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `eslint-config-prettier` | current npm `latest` (verify at install time — outside this pass's focus) | Disables ESLint stylistic rules that would conflict with Prettier | Only if Prettier is adopted. Next.js's own docs show this exact pairing recipe (`import prettier from "eslint-config-prettier/flat"`). FEATURES.md already scopes Prettier as a P3/differentiator ("format-on-save only, never a blanket reformat commit") — not required for the base ESLint setup, and that existing scoping is not re-litigated here. |

## Installation

```bash
# Core lint toolchain
npm install -D eslint@10.7.0 eslint-config-next@16.2.10 typescript-eslint@8.64.0

# Tailwind v4-aware deprecated-class detection
npm install -D eslint-plugin-better-tailwindcss@4.6.1

# Vitest-specific correctness rules (test files only)
npm install -D @vitest/eslint-plugin@1.6.23
```

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Next.js ESLint config | `eslint-config-next` flat-config exports | `@next/eslint-plugin-next` used directly, unwrapped | Official docs frame direct plugin usage as the path for projects with conflicting existing configs (custom `airbnb`/`react-app` presets, custom `parserOptions`) — none apply here, since this is a from-scratch setup. `eslint-config-next` is the simpler, officially-recommended default for exactly this "nothing installed yet" situation. |
| TypeScript rules | `eslint-config-next/typescript` as the base TS-rules source, `typescript-eslint` installed for its `tseslint.config()` helper/future type-checked tier | Installing only the legacy split packages `@typescript-eslint/parser` + `@typescript-eslint/eslint-plugin` | The unified `typescript-eslint` meta-package is the current officially-documented install path in typescript-eslint's own Quickstart; the split-package install is the older, superseded pattern. |
| Tailwind v4 lint plugin | `eslint-plugin-better-tailwindcss` | `eslint-plugin-tailwindcss` (francoismassart) | Confirmed via direct rule-list inspection: no v3→v4 deprecated-class-rename detection rule exists (`migration-from-tailwind-2` targets the wrong migration direction, v2→v3). Reasonable for class-ordering/contradiction rules generally, but does not solve this milestone's specific stated need. |
| Tailwind v4 lint plugin | `eslint-plugin-better-tailwindcss` | `@poupe/eslint-plugin-tailwindcss` | Surfaced during research as another Tailwind-v4-specific option; not evaluated in depth this session since `better-tailwindcss` already has a confirmed matching `no-deprecated-classes` rule, active maintenance, and out-of-the-box `cn`/`cva`/`clsx` recognition matching this project's existing utility usage. Worth a second look only if `better-tailwindcss`'s findings prove unexpectedly noisy in practice. |
| Vitest test-file rules | `@vitest/eslint-plugin` (official, `vitest-dev` org) | `eslint-plugin-vitest` (community, unscoped name) | `npm view eslint-plugin-vitest version` resolved to a stale `0.5.4` versus `@vitest/eslint-plugin`'s actively-maintained `1.6.23` — the scoped package is the Vitest project's own current plugin; the unscoped name is a legacy/superseded package. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|--------------|
| `next lint` (any form, including a script alias) | Removed entirely in Next.js 16 (`v16.0.0` changelog, re-confirmed this session against the official docs, `lastUpdated: 2025-11-10`) — the command does not exist in `next@16.2.10`. | ESLint CLI directly: `eslint .`, wired as `"lint": "eslint ."` in `package.json`. |
| Legacy `.eslintrc.json`/`.eslintrc.js` config format for this from-scratch setup | Not the right choice when there's no existing legacy config to migrate — flat config (`eslint.config.mjs`) is ESLint 9+/10+'s default and primary format. The `FlatCompat` shim (`@eslint/eslintrc`) exists specifically for migrating *existing* legacy configs, which this repo doesn't have (zero prior lint tooling). | Native flat config, no compatibility shim needed. |
| A hand-added `languageOptions.globals` block for `describe`/`it`/`expect` in the Vitest test-file ESLint override | Unnecessary for this specific codebase — `vitest.config.ts` sets `globals: false` and every test file already imports these identifiers explicitly from `"vitest"`, so `no-undef` has nothing to flag. Adding an unused globals block is dead config that misrepresents how this codebase's tests actually work. | Explicit imports (already the codebase convention) + `@vitest/eslint-plugin`'s `recommended` config, `files`-scoped, for Vitest-specific correctness rules. |
| `eslint-plugin-tailwindcss` (francoismassart) specifically for "catch deprecated v3→v4 class names" | Its migration rule targets v2→v3, not v3→v4 — does not solve this milestone's stated problem despite otherwise supporting Tailwind v4 syntax. | `eslint-plugin-better-tailwindcss`'s `no-deprecated-classes`/`enforce-canonical-classes` rules. |
| Installing both `eslint-config-next/typescript` AND a separately hand-rolled `typescript-eslint` `recommended` block in the same base config | Redundant/conflicting rule registration for the same concern (both provide `@typescript-eslint/recommended`-derived rules). | `eslint-config-next/typescript` as the sole TS-rules source initially; adopt `typescript-eslint`'s own `recommended-type-checked` config later as a replacement, not an addition, if/when that upgrade is pursued. |
| `typescript-eslint`'s `strict`/`strict-type-checked` tiers | Already ruled out by the parallel research pass (FEATURES.md) as too noisy for a first-pass retrofit on a two-milestone-old codebase — not re-litigated here, just reaffirmed as out of scope for this stack decision too. | `recommended` now; `recommended-type-checked` as the later, still-stable upgrade tier. |

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|------------------|-------|
| `eslint@10.7.0` | `eslint-config-next@16.2.10` | Both current `latest` as of this research; Next's own docs (dated 2025-11-10) already document flat-config setup against this exact version pairing. |
| `eslint@10.7.0` | `typescript-eslint@8.64.0` | typescript-eslint's own docs/Context7 confirm flat-config `tseslint.config()` works with current ESLint major versions; no version-specific caveat found. |
| `eslint-plugin-better-tailwindcss@4.6.1` | `eslint@10.7.0`, `tailwindcss@4.3.3` | `eslint` and `oxlint` are both **optional** peer deps (works with either) — confirmed via `npm view ... peerDependenciesMeta`; `tailwindcss` peer range `^3.3.0 \|\| ^4.1.17` covers this project's installed `4.3.3`. |
| `@vitest/eslint-plugin@1.6.23` | `eslint@10.7.0`, `vitest@4.1.10`, `typescript@7.0.2` | Peer deps confirmed via `npm view`: `eslint: >=8.57.0`, `typescript: >=5.0.0`, `vitest: *` — all satisfied. |
| `typescript@7.0.2` (tsgo) | `typescript-eslint@8.64.0`'s non-type-checked `recommended` tier | No conflict — `recommended` (unlike `recommended-type-checked`) never invokes the TypeScript type-checker/Program API, so it's unaffected by tsgo's known Program-API-entry-point gap (the same gap already requiring `next.config.ts`'s `ignoreBuildErrors: true` workaround for `next build`'s internal type-check, per this project's existing Key Decisions log). This gap becomes a real thing to verify only if/when `recommended-type-checked` is adopted later — flag for that future point, not now. |

## Sources

- [Next.js: ESLint Plugin config reference](https://nextjs.org/docs/app/api-reference/config/eslint) — official docs, fetched directly this session, `lastUpdated: 2025-11-10`, version-pinned to `16.2.10` (this project's exact Next.js version). Confirmed: `next lint` removal in v16.0.0, exact `eslint.config.mjs` flat-config examples for `core-web-vitals`/`typescript` sub-exports, `eslint-config-prettier` integration recipe. HIGH confidence.
- Context7 `/websites/nextjs` and `/vercel/next.js` — cross-checked flat-config `eslint.config.mjs` examples (`defineConfig`/`globalIgnores` from `eslint/config`, `FlatCompat` migration-codemod variant) against the WebFetch result above; consistent. HIGH confidence.
- Context7 `/typescript-eslint/typescript-eslint` — `tseslint.config()` flat-config helper, confirmation that `recommended` (non-type-checked) requires no `parserOptions.project`/program setup, current version cross-checked against `npm view typescript-eslint version` (`8.64.0`). HIGH confidence.
- `npm view eslint / eslint-config-next / typescript-eslint / eslint-plugin-tailwindcss / eslint-plugin-better-tailwindcss / eslint-plugin-vitest / @vitest/eslint-plugin version|peerDependencies|peerDependenciesMeta|dist-tags|readme` — live npm registry lookups performed this session, HIGH confidence (not training data).
- [eslint-plugin-tailwindcss GitHub — rules directory](https://github.com/francoismassart/eslint-plugin-tailwindcss/tree/master/lib/rules) and its [v4.0.3 release notes](https://github.com/francoismassart/eslint-plugin-tailwindcss/releases) — fetched directly, confirmed the v4.x line is a from-scratch Tailwind-v4-only rewrite, and confirmed no v3→v4 deprecated-class rule exists (`migration-from-tailwind-2` targets v2→v3 instead). MEDIUM-HIGH confidence (direct file/release-note inspection, not a summarized secondary source).
- `eslint-plugin-better-tailwindcss` README (fetched via `npm view ... readme`, matching `github.com/schoero/eslint-plugin-better-tailwindcss`) and its `docs/parsers/tsx.md` (fetched directly) — confirmed `no-deprecated-classes`/`enforce-canonical-classes` rules, their `tw4`-only/`recommended`-config-included status, the exact flat-config `entryPoint` setup for Tailwind v4's CSS-based config, and built-in `cn`/`cva`/`clsx`/`twMerge` utility recognition. HIGH confidence (primary-source README/docs, not a secondary blog summary).
- `@vitest/eslint-plugin` README (fetched via `npm view ... readme`) — confirmed current flat-config setup syntax, peer dependency versions, and the `files`-scoped registration pattern. HIGH confidence (primary-source README).
- This repo's own `vitest.config.ts`, `tsconfig.json`, `package.json`, `next.config.ts`, and a sample test file (`src/components/gallery/GalleryCard.test.tsx`) — read directly this session to confirm the project-specific finding that `globals: false` + explicit imports means the generic "ESLint+Vitest globals" gotcha does not apply here, and to confirm the Tailwind CSS entry point path (`app/globals.css`) for the `better-tailwindcss` plugin's `entryPoint` setting. HIGH confidence (primary source: the actual repo).

---
*Stack research for: v1.2 Tech Debt & Stabilization milestone (ESLint/lint-tooling setup), COLREGS Navigator*
*Researched: 2026-07-19*
