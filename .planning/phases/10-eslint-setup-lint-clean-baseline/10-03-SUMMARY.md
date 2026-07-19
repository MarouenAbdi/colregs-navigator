---
phase: 10-eslint-setup-lint-clean-baseline
plan: 03
subsystem: infra
tags: [eslint, suppressions, editorconfig, readme, lint-clean-baseline]

# Dependency graph
requires:
  - phase: 10-01
    provides: "Working eslint.config.mjs flat config (@next/eslint-plugin-next core-web-vitals + Babel-parser TS/JSX syntax parsing), npm run lint/lint:fix scripts"
  - phase: 10-02
    provides: "Tailwind/Vitest plugins, domain-boundary no-restricted-imports rule, custom stale-ID/raw-CSS rules -- the larger, precisely-scoped set of known violations this plan resolves"
provides:
  - "npm run lint exits 0 on the full codebase (254 errors -> 0 errors, 3 pre-existing max-lines warnings remain by design)"
  - "eslint-suppressions.json: tracked, non-empty (62 files) suppression record for pre-existing debt, not rule-disabling"
  - "Repo-root .editorconfig (UTF-8, LF, 2-space indent, final newline)"
  - "README.md 'Linting & Code Quality' section documenting lint tooling and the type-checked-tier limitation"
affects: [11-tailwind-deprecated-class-fixes, 12-sandbox-file-structure-refactor, 13-comment-cleanup]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Two-pass eslint --fix (non-domain broad via --ignore-pattern, then src/domain/ scoped and reviewed line-by-line) before any bulk suppression, to keep the highest-risk edit surface (rules-engine code) under manual review"
    - "eslint --fix --suppress-all as the from-scratch lint-retrofit adoption mechanism -- eslint-suppressions.json as a visible, diffable debt ledger rather than rule-disabling"

key-files:
  created: ["eslint-suppressions.json", ".editorconfig"]
  modified: ["README.md", "vitest.setup.ts"]

key-decisions:
  - "src/domain/'s Pass 2 eslint --fix produced a zero-diff result -- every remaining finding in src/domain/ (stale-ID comments, vitest/no-conditional-expect, max-lines) is non-autofixable, so the 'line-by-line review' had nothing to review beyond confirming this. vessel-priority.ts's 5 single-quoted PRIORITY keys are unchanged, confirmed by direct grep."
  - "Removed vitest.setup.ts's dead `// eslint-disable-next-line @typescript-eslint/no-explicit-any` comment (line 23) rather than replacing it with a current rule name -- no type-aware `any`-flagging rule exists anywhere in this toolchain (no typescript-eslint installed at all, by design per the STACK.md CORRECTION), so the directive was pure dead code producing a standing 'rule not found' error with nothing to actually disable."
  - "Did not attempt typescript-eslint's recommended-type-checked tier in any form (not even a try-then-revert) -- per the plan's explicit rewrite of Task 3, this is documented as a deliberate, permanent toolchain incompatibility (typescript-eslint's peer range tops out below typescript@7.0.2/tsgo; @typescript-eslint/parser crashes at require-time against it), not a noise-driven fallback."

patterns-established:
  - "eslint-suppressions.json as this project's from-scratch lint-adoption debt ledger: committed, non-empty, diffable in any future PR touching a suppressed file -- future phases (11-13) inherit and are expected to shrink it as they touch the specific files they're already refactoring, not to regenerate it wholesale."

requirements-completed: [LINT-06, LINT-02]

# Metrics
duration: 25min
completed: 2026-07-19
---

# Phase 10 Plan 03: Lint-Clean Baseline Summary

**Reached zero-error `npm run lint` (from 254 errors) via a reviewed two-pass `eslint --fix` (src/domain/'s pass was a zero-diff no-op, confirming nothing autofixable existed there) plus `eslint --fix --suppress-all` (62-file `eslint-suppressions.json`), fixed the pre-existing dead `@typescript-eslint/no-explicit-any` disable comment in `vitest.setup.ts`, and documented the toolchain's permanent lack of a type-checked ESLint tier in a new README section -- zero rules disabled or downgraded.**

## Performance

- **Duration:** ~25 min
- **Completed:** 2026-07-19T18:50:00Z
- **Tasks:** 3 (all auto)
- **Files modified:** 4 modified (`vitest.setup.ts`, `README.md`, plus 22 non-domain component files autofixed), 2 created (`eslint-suppressions.json`, `.editorconfig`)

## Accomplishments
- Confirmed the pre-plan baseline matched expectations: `npm run lint` reported 414 problems (254 errors, 160 warnings) before this plan started
- Fixed `vitest.setup.ts`'s standing `@typescript-eslint/no-explicit-any` "rule not found" error by removing the dead `eslint-disable-next-line` comment -- no type-aware rule of that name exists anywhere in this toolchain to actually disable
- Pass 1 (non-domain, `--ignore-pattern "src/domain/**"`): applied safe `better-tailwindcss` autofixes (canonical Tailwind class reordering, multiline reformatting) across 22 component/layout files -- spot-checked several diffs, confirmed zero classes added/removed, purely cosmetic
- Pass 2 (`src/domain/`, scoped `eslint --fix`): produced a **zero-diff result** -- confirmed every remaining `src/domain/` finding (stale-ID comments, `vitest/no-conditional-expect`, `max-lines`) is non-autofixable; `vessel-priority.ts`'s 5 single-quoted `PRIORITY` keys (`not-under-command`, `restricted-in-ability-to-maneuver`, `fishing`, `sailing`, `power-driven`) confirmed unchanged by direct grep
- Ran the full test suite: 194 passed, 13 pre-existing DB-connectivity failures (identical failure set confirmed via `git stash` A/B comparison, unrelated to this plan's changes) -- `classify-encounter.test.ts`'s Rule-13-overtaking-overrides-Rule-18 regression case (8 "overtaking" tests) passes
- `eslint --fix --suppress-all` swept the remaining error-level violations (stale-ID comments, `vitest/no-conditional-expect`, `better-tailwindcss/no-unknown-classes`) into `eslint-suppressions.json` (62 files, valid JSON, non-empty); `npm run lint` now exits 0, with only 3 pre-existing `max-lines` warnings remaining (`classify-encounter.ts`/`.test.ts`/`.fixtures.ts`, already scoped to Phase 12's refactor)
- Verified `eslint.config.mjs` has zero diff from Task 2's suppression run and zero diff from Task 3's documentation task (config file untouched both times, confirmed via `git diff` against the pre-plan commit) -- zero rules set to `"off"`; the sole `"warn"` entry is Plan 02's pre-existing `max-lines` nudge
- Added a repo-root `.editorconfig` (UTF-8, LF, 2-space indent, final newline) matching the repo's existing consistent formatting (confirmed via hexdump of an existing file)
- Added README.md's "Linting & Code Quality" section: `npm run lint`/`lint:fix` usage, which CLAUDE.md conventions are lint-enforced (domain-boundary imports, stale-ID comments, raw-CSS-as-template-literal) vs. still human-reviewed (JSX duplication, comment WHY-quality), what `eslint-suppressions.json` represents, and an explicit "known, deliberate limitation" paragraph on the missing type-checked ESLint tier (naming `typescript-eslint`'s peer-dependency range vs. `typescript@7.0.2`/tsgo as the exact cause, and confirming `npm run typecheck` covers type safety unaffected)
- Confirmed `typescript-eslint` was never installed in this plan (`npm ls typescript-eslint` reports absent) and `eslint.config.mjs` contains zero references to it

## Task Commits

Each task was committed atomically:

1. **Task 1: Two-pass eslint --fix (non-domain broad, src/domain/ reviewed line-by-line) with regression re-verification** - `067754b` (fix)
2. **Task 2: eslint --fix --suppress-all to reach the lint-clean baseline; confirm no rule disabled to get there** - `e26e7b8` (feat)
3. **Task 3: Document the type-checked-tier limitation as deliberate (not attempted), plus .editorconfig and README polish** - `0102dca` (docs)

**Plan metadata:** (this commit, docs: complete plan)

## Files Created/Modified
- `eslint-suppressions.json` - New: ESLint's native bulk-suppression file, 62 file entries, tracking pre-existing debt (stale-ID comments, `vitest/no-conditional-expect`, `better-tailwindcss/no-unknown-classes`) discovered by Plan 02's newly-enforced rules
- `.editorconfig` - New: repo-root editor consistency config (UTF-8, LF, 2-space indent, final newline; `.md` files exempted from trailing-whitespace trimming)
- `README.md` - Extended: new "Linting & Code Quality" section after "Local Setup"
- `vitest.setup.ts` - Removed dead `@typescript-eslint/no-explicit-any` eslint-disable comment (line 23); the stale-ID comments on lines 1 and 11 were left untouched (out of scope for this plan, tracked in `eslint-suppressions.json`, Phase 13's job)
- 22 non-domain component/layout files (`app/layout.tsx`, `app/s/[shareId]/page.tsx`, `src/components/gallery/*`, `src/components/hero/*`, `src/components/layout/*`, `src/components/sandbox/*` non-domain files, `src/components/shared/SectionGridBackground.tsx`, `src/components/ui/*`) - Tailwind class-reordering/multiline-formatting autofixes only, zero classes added or removed

## Decisions Made
- Removed (rather than replaced) the dead `@typescript-eslint/no-explicit-any` disable comment in `vitest.setup.ts` -- there is no current rule name to replace it with, since this toolchain has zero type-aware `any`-flagging rule by design (no `typescript-eslint` installed at all)
- Treated `src/domain/`'s zero-diff `eslint --fix` result as sufficient "line-by-line review" evidence in itself -- confirmed by re-reading the full remaining-violations list for that directory and verifying every item is a category `eslint --fix` cannot mechanically resolve (comment content, conditional test structure, file length)
- Did not attempt any form of `typescript-eslint`'s `recommended-type-checked` tier -- per the plan's explicit revision, this was documented as a permanent toolchain incompatibility rather than trialed and reverted

## Deviations from Plan

None - plan executed exactly as written, including its Task 3 revision (documentation-only, no type-checked-tier attempt).

## Issues Encountered

None beyond expected findings. The `vitest.setup.ts` rule-reference fix wasn't spelled out as its own task in the plan body but was required by this plan's overall success criteria (deferred from Plan 01's summary as "explicitly deferred to Plan 03") -- resolved as a small manual edit at the start of Task 1's non-domain pass, since it lives outside `src/domain/` and isn't autofixable by `eslint --fix` itself (a rule-reference error, not a violation of an existing rule).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- `npm run lint` exits 0; `eslint-suppressions.json` is the committed, visible mechanism for the 62 files of pre-existing debt this retrofit surfaced -- future phases (11: Tailwind fixes, 12: Sandbox refactor, 13: comment cleanup) will naturally shrink specific suppression entries as they touch those exact files, not as a separate cleanup task
- The 3 remaining `max-lines` warnings (`classify-encounter.ts` at 219 lines, `.test.ts` at 336, `.fixtures.ts` at 397) are pre-identified and already in Phase 12's refactor scope -- no new action needed from this plan
- The type-checked-ESLint-tier gap is now visible in both README.md and this summary, not silently dropped -- a future contributor reading either document understands it's a deliberate, tracked limitation tied to the `typescript@7.0.2`/tsgo lock, not an oversight
- No blockers for Phase 11 (Tailwind deprecated-class fixes) or later phases

---
*Phase: 10-eslint-setup-lint-clean-baseline*
*Completed: 2026-07-19*
