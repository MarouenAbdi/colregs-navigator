---
quick_id: 260720-kg5
type: quick
subsystem: tooling/eslint
tags: [eslint, tech-debt, cleanup]
key-files:
  modified:
    - eslint.config.mjs
    - eslint-suppressions.json
  deleted:
    - eslint-rules/no-stale-id-comments.mjs
decisions:
  - "Removed the local/no-stale-id-comments custom ESLint rule entirely (registration, source file, all suppression entries) rather than fixing the flagged comments — user decided to stop enforcing the rotting-ID-comment convention via lint."
metrics:
  duration: 10min
  completed: 2026-07-20
---

# Quick Task 260720-kg5: Remove local/no-stale-id-comments ESLint rule Summary

Removed the custom `local/no-stale-id-comments` ESLint rule -- its registration
block and import in `eslint.config.mjs`, the rule source file
`eslint-rules/no-stale-id-comments.mjs`, and all 27 corresponding entries in
`eslint-suppressions.json` -- without touching any of the comment text the
rule used to flag.

## What Changed

**Task 1 (`e38b618`):** Removed the `import noStaleIdComments from
"./eslint-rules/no-stale-id-comments.mjs"` import and the flat-config object
registering `local/no-stale-id-comments` as an error-level rule from
`eslint.config.mjs`. Deleted `eslint-rules/no-stale-id-comments.mjs` (its only
file; no co-located test file existed). All other config blocks (Next.js
core-web-vitals, babel parser, better-tailwindcss, vitest, domain-boundary
`no-restricted-imports`/`max-lines`, `no-restricted-syntax`, `globalIgnores`)
are byte-identical to before.

**Task 2 (`1dcd6d8`):** Pruned `eslint-suppressions.json`. Removed the entire
top-level file entry for the 27 files whose only rule key was
`local/no-stale-id-comments` (including `eslint-rules/no-stale-id-comments.mjs`
itself, now deleted). Removed just the `local/no-stale-id-comments` key (kept
the file entry) for `src/components/hero/hero-preview-fixture.test.ts`, which
retains its `vitest/no-conditional-expect` key. Left the 10 files with no
`local/no-stale-id-comments` key untouched.

## Verification

- `grep -c "no-stale-id-comments" eslint.config.mjs` -> `0`
- `test -f eslint-rules/no-stale-id-comments.mjs` -> fails (file absent)
- `eslint-suppressions.json` parses as valid JSON, contains zero
  `local/no-stale-id-comments` substrings, no dangling empty file objects
- `npm run lint` exits `0` -- `0 errors, 3 warnings` (the 3 warnings are
  pre-existing `max-lines` warnings on `classify-encounter.fixtures.ts`,
  `classify-encounter.test.ts`, `classify-encounter.ts`, unrelated to this
  change and present before it)

## Deviations from Plan

None -- plan executed exactly as written.

## Out-of-Scope Observations (not fixed, logged only)

While verifying, `npm run test -- --run` was also run as an extra safety net
(not required by this plan's verification section, which only calls for
`npm run lint`). 13 tests across 4 files failed
(`scenario-service.test.ts`, `scenario-repository.test.ts`,
`scenario.test.ts`, `GalleryContainer.test.tsx`), all with
`TRPCError: INTERNAL_SERVER_ERROR` / DB-connection-shaped failures. This
worktree has no `DATABASE_URL` configured and no local Postgres running --
these are pre-existing DB-integration test failures caused by the environment,
not by this task's ESLint-only changes (which touched no application code).
Out of scope per the executor's scope-boundary rule; not fixed here.

## Self-Check: PASSED

- FOUND: eslint.config.mjs
- FOUND: eslint-rules/no-stale-id-comments.mjs absent as expected
- FOUND: eslint-suppressions.json
- FOUND commit: e38b618
- FOUND commit: 1dcd6d8
