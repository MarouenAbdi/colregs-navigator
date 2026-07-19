---
phase: 10-eslint-setup-lint-clean-baseline
verified: 2026-07-19T19:45:00Z
status: passed
score: 10/10 must-haves verified
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 9/10 (frontmatter said 8/9; body said 9/10 — see note below)
  gaps_closed:
    - "CR-01's claimed resolution (\"restored to rounded-[0.25rem], exact pixel-identical prior radius\") now matches the actual shipped code in commit 185f91b"
  gaps_remaining: []
  regressions: []
---

# Phase 10: ESLint Setup & Lint-Clean Baseline Verification Report

**Phase Goal:** The codebase has ESLint installed, configured, and wired into `npm run lint`, reaching a lint-clean baseline that also enforces this project's architecture boundary and existing documented conventions — without disabling or downgrading any rule to get there.
**Verified:** 2026-07-19T19:45:00Z
**Status:** passed
**Re-verification:** Yes — after gap closure (commit `185f91b`)

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `npm run lint`/`npm run lint:fix` exist and invoke the ESLint CLI directly | VERIFIED (regression check) | `package.json`: `"lint": "eslint .", "lint:fix": "eslint . --fix"`. Re-ran `npm run lint` myself: exits 0. |
| 2 | `eslint.config.mjs` applies `@next/eslint-plugin-next`'s `core-web-vitals` config directly; `.ts`/`.tsx` parsed via `@babel/eslint-parser` | VERIFIED (regression check) | Read current `eslint.config.mjs`: unchanged structurally from prior verification except the new scoped `ignore` entry on `enforce-canonical-classes`. |
| 3 | Tailwind v4-aware rules active repo-wide; Vitest rules scoped only to test files | VERIFIED (regression check) | `eslintPluginBetterTailwindcss.configs.recommended` still applied repo-wide; Vitest block still scoped to `src/**/*.test.{ts,tsx}`, unchanged. |
| 4 | Importing `src/server/`, Next.js, tRPC, or Prisma from `src/domain/` produces a lint error | VERIFIED (regression re-run) | Live `eslint --stdin` re-check: `@/server/db/client` import from a `src/domain/` path → `no-restricted-imports` error, exit 1. |
| 5 | A stale Phase/Plan/REQ-ID comment and a raw-CSS-as-template-literal string both produce lint errors | VERIFIED (regression re-run) | Live `eslint --stdin` re-check: `// Phase 3 fix applied here` → `local/no-stale-id-comments` error, exit 1. |
| 6 | `npm run lint` exits 0 on the full codebase | VERIFIED (re-run myself) | `npm run lint`: 0 errors, 3 pre-scoped `max-lines` warnings on `src/domain/colregs/*` (explicitly scoped to Phase 12), exit 0. |
| 7 | No rule was set to `off`/downgraded project-wide | VERIFIED (re-checked) | `grep '"off"' eslint.config.mjs` → no matches. Only non-default severities are `"warn"` (`max-lines`, and the new scoped `enforce-canonical-classes` entry — both intentional, neither `off`). |
| 8 | Full test suite passes, no behavior drift | VERIFIED (re-run myself) | `npm test -- --run`: 209/209 passed, 36 test files. `npm run typecheck`: exits 0, no errors. |
| 9 | No type-checked ESLint tier attempted; documented as a deliberate limitation in README.md | VERIFIED (regression check) | README's "Known limitation" section unchanged; `typescript-eslint` still absent from `package.json`/config. |
| 10 | CR-01's claimed resolution ("restored to `rounded-[0.25rem]`, exact pixel-identical prior radius") now matches the actual shipped code, and a mechanism prevents recurrence | **VERIFIED** | `git show 185f91b -- src/components/sandbox/ChartPanel.tsx src/components/sandbox/SandboxContainer.tsx` shows both files changed from `rounded-lg` back to `rounded-[0.25rem]`. Confirmed live in current working tree (`grep rounded` on both files shows `rounded-[0.25rem]` on ChartPanel.tsx:446 and SandboxContainer.tsx:230). Ran `npm run lint` (no `--fix`): exit 0, zero warnings/errors on either line — the `ignore: ["^rounded-\\[0\\.25rem\\]$"]` option scoped to `enforce-canonical-classes` in `eslint.config.mjs:56` suppresses it precisely. **Proved the ignore is load-bearing, not decorative**: temporarily stripped the `ignore` option from a copy of the config and re-ran `eslint` on just these two files — it immediately re-fired `"The class: rounded-[0.25rem] can be simplified to rounded-lg"` on both lines (the exact regression CR-01 was meant to fix), then restored the original config (confirmed via `git diff eslint.config.mjs` — clean, no stray changes). |

**Score:** 10/10 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `package.json` | `lint`/`lint:fix` scripts; pinned devDependencies | VERIFIED | Unchanged from prior verification, re-confirmed. |
| `eslint.config.mjs` | Full layered flat config, no rule at `off` | VERIFIED | Re-read end-to-end. The only change since prior verification is the added `ignore` option on `better-tailwindcss/enforce-canonical-classes` (still `"warn"` severity, not `"off"`) — precisely the fix requested. |
| `eslint-rules/no-stale-id-comments.mjs` | Local rule, unchanged | VERIFIED | Re-fired live, still functions. |
| `eslint-suppressions.json` | Non-empty, valid JSON debt ledger | VERIFIED | Parses as valid JSON. |
| `src/components/sandbox/ChartPanel.tsx` | `rounded-[0.25rem]` restored (pixel-exact to original `rounded` = 0.25rem) | **VERIFIED** | Line 446: `className="rounded-[0.25rem] border border-border bg-chart-surface"`. Matches the original pre-Phase-10 bare `rounded` value (0.25rem, confirmed via `git show 067754b^` showing the pre-autofix bare `rounded` class) — genuinely pixel-identical this time. |
| `src/components/sandbox/SandboxContainer.tsx` | `rounded-[0.25rem]` restored | **VERIFIED** | Line 230: same value, same pixel-exact match confirmed against pre-Phase-10 history. |
| `10-REVIEW.md` Resolution section | Accurately documents the self-correction (not the original wrong claim) | VERIFIED | Read lines 287-325: explicitly documents that the first fix (`64a3944`) was silently undone by the same commit's `eslint --fix --suppress-all` pass, and describes the actual two-part remedy (restore value + scoped `ignore` guard). This is an honest, corrected account, not a repeat of the original inaccurate claim. |
| `.planning/REQUIREMENTS.md` | LINT-03/04/06/07/08 checkboxes and traceability table marked Done | VERIFIED | All of LINT-01 through LINT-08 now show `[x]` and the traceability table (lines 74-81) shows "Done (Plan NN)" for all eight, no "Pending" entries remain. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `package.json scripts.lint` | `eslint.config.mjs` | `"eslint ."` CLI invocation | WIRED | `npm run lint` exits 0. |
| `eslint.config.mjs`'s tailwind block | `enforce-canonical-classes`' `ignore` option | scoped regex `^rounded-\[0\.25rem\]$` | WIRED | Empirically proved bidirectionally: fires without the ignore (reproduced the exact regression), silent with it. |
| `10-REVIEW.md` Resolution section | Actual commit history (`64a3944`, `185f91b`) | narrative accuracy | WIRED | Cross-checked against `git log`/`git show` — the corrected narrative matches the real sequence of events. |
| `.planning/REQUIREMENTS.md` checkboxes | Actual `eslint.config.mjs` implementation | LINT-03/04/06/07/08 | WIRED | Checkboxes now reflect functionally-complete, previously-verified code (no change needed to the underlying implementation, only the doc). |

### Data-Flow Trace (Level 4)

Not applicable — this phase's artifacts are tooling configuration (ESLint rules), not data-rendering components.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Lint exits 0 on full repo (no `--fix`) | `npm run lint` | 0 errors, 3 pre-scoped `max-lines` warnings | PASS |
| Full test suite green | `npm test -- --run` | 209/209 passed, 36 files | PASS |
| Typecheck green | `npm run typecheck` | exits 0, no errors | PASS |
| `rounded-[0.25rem]` restored on both files | `git show 185f91b` diff + live `grep` | Both files show `rounded-[0.25rem]`, not `rounded-lg` | PASS |
| Ignore pattern actually suppresses the warning | `npx eslint` on both files | 0 problems | PASS |
| Ignore pattern is load-bearing (not decorative) | `npx eslint` on both files with `ignore` option stripped from a temp config copy | Warning re-fires: `"rounded-[0.25rem]" can be simplified to "rounded-lg"` on both lines | PASS (proves necessity) |
| No rule set to `off` | `grep '"off"' eslint.config.mjs` | No matches | PASS |
| Domain-boundary rule still fires | `eslint --stdin` w/ `@/server/db/client` import | exit 1, `no-restricted-imports` | PASS |
| Stale-ID rule still fires | `eslint --stdin` w/ `// Phase 3 fix applied here` | exit 1, `local/no-stale-id-comments` | PASS |
| REQUIREMENTS.md checkboxes corrected | `grep LINT-0 .planning/REQUIREMENTS.md` | All 8 show `[x]`, traceability table all "Done" | PASS |
| Working tree left clean after temp-config experiment | `git diff --stat eslint.config.mjs` | No output (clean) | PASS |

### Probe Execution

No `scripts/*/tests/probe-*.sh`-style probes found or referenced by this phase. SKIPPED (this phase's own verification mechanism is `npm run lint`/`npm test`, both run directly above).

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|--------------|------------|--------------|--------|----------|
| LINT-01 | 10-01 | ESLint installed/configured via flat config, bypassing `eslint-config-next` | SATISFIED | Code verified; REQUIREMENTS.md `[x]`. |
| LINT-02 | 10-01, 10-03 | `.ts`/`.tsx` parsed via `@babel/eslint-parser`, not `@typescript-eslint/parser` | SATISFIED | Code verified; REQUIREMENTS.md `[x]`. |
| LINT-03 | 10-02 | `eslint-plugin-better-tailwindcss` configured, Tailwind v4-aware | SATISFIED | Code verified; REQUIREMENTS.md now `[x]` (previously unchecked — corrected in `185f91b`). |
| LINT-04 | 10-02 | `@vitest/eslint-plugin` scoped to test files only | SATISFIED | Code verified; REQUIREMENTS.md now `[x]`. |
| LINT-05 | 10-01 | `npm run lint` script wired | SATISFIED | REQUIREMENTS.md `[x]`. |
| LINT-06 | 10-03 | Lint-clean baseline reached via suppressions, not rule-disabling | SATISFIED | `npm run lint` exits 0; zero `"off"` entries; REQUIREMENTS.md now `[x]`. |
| LINT-07 | 10-02 | `no-restricted-imports` architecture-boundary rule | SATISFIED | Live-fired; REQUIREMENTS.md now `[x]`. |
| LINT-08 | 10-02 | Custom stale-ID + raw-CSS `no-restricted-syntax` rules | SATISFIED | Live-fired both directions; REQUIREMENTS.md now `[x]`. |

No orphaned requirements — all 8 LINT-* IDs mapped to Phase 10 in the traceability table are accounted for above.

### Anti-Patterns Found

None. No `TBD`/`FIXME`/`XXX` debt markers in any file touched by this phase or its corrective commit. No disabled/downgraded rule severities in `eslint.config.mjs` (confirmed via `grep '"off"'`, zero matches). The `enforce-canonical-classes` scoped `ignore` addition is not a downgrade — it remains `"warn"` severity and continues to fire on every other class-simplification opportunity in the codebase; only this one exact, deliberately-chosen, pixel-verified value is excluded, with an inline WHY-comment explaining the theme-override reason per CLAUDE.md's comment convention.

### Human Verification Required

None. The prior gap and its remediation are fully verifiable programmatically: git diff inspection for the code change, live ESLint execution for the ignore-pattern's effect (both presence and, via a temporary reversal, necessity), and file-content grep for the REQUIREMENTS.md checkbox corrections.

### Note on Phase 11 hand-off (informational, not a Phase 10 gap)

Phase 11's plan (ROADMAP.md success criterion 2: "Bare `rounded` no longer appears... each now uses `rounded-sm`") was written assuming a bare `rounded` class would still be present in `ChartPanel.tsx`/`SandboxContainer.tsx` for it to replace. Since Phase 10's corrective fix, both files instead contain the explicit arbitrary-value form `rounded-[0.25rem]` (functionally/pixel-identical to the original bare `rounded`, per `git show 067754b^`'s pre-autofix history). This is not a Phase 10 goal defect — Phase 10's own goal and success criteria say nothing about the Sandbox files' Tailwind class names — but Phase 11's plan should be re-read against the current file state before execution, since the literal string it expects to find (`rounded`) is no longer there in bare form. Flagging for visibility per the prior verification's note; does not block Phase 10 from being marked passed.

### Gaps Summary

The single gap from the prior verification run — CR-01's claimed resolution not matching the actual shipped code — is now genuinely closed. I independently re-verified all evidence rather than trusting SUMMARY.md/REVIEW.md narration:

1. `git show 185f91b` proves both `ChartPanel.tsx` and `SandboxContainer.tsx` were changed back to `rounded-[0.25rem]`, and this is confirmed present in the current working tree.
2. `npm run lint` (without `--fix`) exits 0 with zero warnings on either file's radius class.
3. I proved the scoped `ignore` pattern is load-bearing (not just present) by temporarily removing it from a working copy of the config and re-running ESLint on just these two files — the exact "can be simplified to rounded-lg" warning that caused the original regression re-appeared immediately, then disappeared again once the original config was restored. The working tree was left clean (`git diff --stat eslint.config.mjs` empty) after this experiment.
4. The `ignore` entry is `"warn"` with an `{ ignore: [...] }` options object, not `"off"` — confirmed via direct file read and `--print-config`. No rule anywhere in `eslint.config.mjs` is disabled.
5. `10-REVIEW.md`'s Resolution section now accurately narrates the self-correction (first fix silently undone, then properly fixed with a structural guard) rather than repeating the original incorrect "pixel-identical" claim without qualification.
6. `.planning/REQUIREMENTS.md`'s LINT-03/04/06/07/08 checkboxes and traceability table entries are now all marked Done/`[x]`, matching the underlying code that was already functionally complete.
7. Full regression pass: `npm test -- --run` (209/209 passed), `npm run typecheck` (clean), and re-fired the domain-boundary and stale-ID-comment rule checks live — all still function correctly, no regressions introduced by the corrective commit.

Phase 10's goal — ESLint installed, wired into `npm run lint`, enforcing the architecture boundary and CLAUDE.md conventions, reaching a zero-error baseline without disabling any rule — is fully and verifiably achieved. All 10 observable truths pass, all required artifacts pass all three verification levels, all key links are wired, and no anti-patterns or debt markers were found.

---

_Verified: 2026-07-19T19:45:00Z_
_Verifier: Claude (gsd-verifier)_
