# Deferred Items — Phase 20

## Plan 20-02

Out-of-scope discoveries found while running the full `npx vitest run` suite as a
sanity check after this plan's changes (not caused by this plan, not fixed):

- `src/components/gallery/GalleryContainer.test.tsx`, `src/server/application/scenario-service.test.ts`,
  `src/server/db/scenario-repository.test.ts`, `src/server/api/routers/scenario.test.ts` all fail in
  this worktree because `generated/prisma/client.js` doesn't exist (`prisma generate` requires a real
  `DATABASE_URL`, not set in this isolated worktree environment). This is a pre-existing worktree/CI-env
  gap unrelated to `ReasoningTrail.tsx`/`SandboxContainer.tsx` — the two files this plan touches — and
  is out of this plan's scope per the executor's scope-boundary rule. `npx tsc --noEmit` shows the same
  root cause (`src/server/db/client.ts` can't resolve the generated module).
