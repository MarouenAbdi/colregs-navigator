# Deferred Items — 260718-qgs

## Pre-existing tsc error (out of scope)

`npx tsc --noEmit` reports one error unrelated to this task:

```
src/server/db/client.ts(1,30): error TS2307: Cannot find module '../../../generated/prisma/client.js'
```

Cause: the Prisma generated client (`generated/prisma/`) does not exist in this
worktree, and `npx prisma generate` fails locally because `DATABASE_URL` is not
set (`prisma.config.ts` requires it to resolve the datasource). This is a
pre-existing environment/build issue in `src/server/db/client.ts` — introduced
in commit `6143f1e` (03-01), unrelated to `src/components/layout/Header.tsx`
and out of scope for this quick task per the executor's scope-boundary rule.

Verified: filtering `tsc --noEmit` output to exclude this one error shows zero
errors, confirming Header.tsx's changes introduce no new type errors.
