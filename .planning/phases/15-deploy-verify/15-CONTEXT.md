# Phase 15: Deploy & Verify - Context

**Gathered:** 2026-07-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Take the app from Phase 14's end state (deploy script fully authored and locally verified, but zero live host connected) to a real, publicly reachable Vercel production URL backed by a provisioned Neon Postgres database — with every `.env.example` variable configured in production, a real DB-backed `/api/health` endpoint, an end-to-end live request verified, a genuine overnight-idle request survived, and a confirmed rollback path. Covers DEPLOY-01, DEPLOY-02, DEPLOY-03, HEALTH-01, HEALTH-02, HEALTH-03, HEALTH-04.

No code changes are expected to `vercel-build`, `scripts/migrate-if-production.mjs`, or the Prisma/adapter setup — those are locked from Phase 14. The only new code this phase should produce is the `/api/health` route handler.

</domain>

<decisions>
## Implementation Decisions

### Provisioning Ownership
- **D-01:** Neither a Vercel nor a Neon account exists yet — both require fresh sign-up.
- **D-02:** The user will do 100% of the manual account creation and dashboard configuration themselves (Vercel project/repo import, Neon project creation, entering env vars in Vercel's production environment). Claude does **not** drive this via browser automation. Claude's job is to produce a clear, ordered checklist for the user to follow, then verify the result afterward.
- **D-03:** Post-setup verification is done via the **Vercel CLI with a token** (`vercel login` / `VERCEL_TOKEN`), not just public HTTP checks against the live URL. The plan should include a step for the user to generate/provide this token.
- **D-04:** The Vercel CLI token's scope is **read + trigger deploy actions** — Claude may run CLI commands that trigger a deploy or promote/rollback a deployment, not just read-only inspection (listing deployments, viewing logs). This is what makes a live, CLI-driven verification of HEALTH-04's rollback path possible, rather than only confirming the button/flow exists.

### Health Check Design (`/api/health`)
- **D-05:** Checks **DB connectivity only** — a lightweight real query (e.g. `SELECT 1` or a trivial Prisma call), not app version/uptime/commit metadata.
- **D-06:** Response is simple JSON + status code: `200 {status: "ok"}` when the DB is reachable, `503 {status: "error"}` when it isn't — no internal error details (stack traces, connection strings) leaked in the body.
- **D-07:** **No explicit timeout** on the DB check — let the query take as long as it needs, bounded only by Vercel's own function timeout. A slow-but-successful Neon cold-start wake-up must still report healthy, not be falsely marked unhealthy by an artificial timeout.
- **D-08:** Response must be **explicitly non-cacheable** (`no-store` / equivalent) — every hit, including the HEALTH-03 overnight-idle check, must genuinely re-run the DB check rather than serve a stale cached response from Vercel's edge network.

### Not Discussed This Session (open for researcher/planner)
- **Rollback verification method** — whether to actually exercise a live deploy→rollback cycle or just confirm the mechanism/documentation. D-04's CLI scope (read + trigger deploy actions) makes a live exercise possible; researcher/planner should decide based on risk/cost during planning.
- **Overnight idle verification logistics (HEALTH-03)** — how to structure the required real time gap across sessions (e.g. a scheduled wake-up check vs. the user manually confirming next session). This phase cannot complete in a single execution pass; the plan must account for a genuine wait period.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase & Requirements Definitions
- `.planning/ROADMAP.md` (Phase 15 section) — goal, success criteria, requirements list
- `.planning/REQUIREMENTS.md` — full text of DEPLOY-01, DEPLOY-02, DEPLOY-03, HEALTH-01, HEALTH-02, HEALTH-03, HEALTH-04

### Phase 14 Deliverables This Phase Builds On
- `.planning/phases/14-pipeline-hooks/14-04-SUMMARY.md` — the `vercel-build` script and `scripts/migrate-if-production.mjs` env-gate logic (`VERCEL_ENV === "production"`); this phase connects a real host to this exact, already-verified script — do not modify it
- `README.md` §"Deployment" (currently states "no live hosted deployment exists yet") — must be updated once live to reflect real, non-aspirational status
- `.env.example` — currently a single variable, `DATABASE_URL`; this is the full scope of DEPLOY-03's env var configuration

### Prior Milestone Context
- `.planning/STATE.md` §"Accumulated Context > Decisions" — records the research-flagged first-deploy risks to verify explicitly (clean-checkout `prisma generate`, `next build --webpack` vs. host auto-detected build command, free-tier DB auto-suspend stacking with serverless cold starts) — directly relevant to HEALTH-01/02/03

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/server/db/client.ts` — the singleton Prisma client (`PrismaClient` + `PrismaPg` adapter, HMR-safe global pattern). The new `/api/health` route should import `prisma` from here rather than constructing its own client.

### Established Patterns
- `app/api/trpc/[trpc]/route.ts` — the existing Next.js Route Handler pattern in this codebase; `app/api/health/route.ts` should follow the same structural convention (Route Handler, not a Pages API route or a tRPC procedure).
- Environment-gating pattern established in `scripts/migrate-if-production.mjs` (strict `=== "production"` equality on `VERCEL_ENV`, never a truthy check) — relevant if any future health-check behavior needs to branch on environment, though D-05–D-08 don't currently require this.

### Integration Points
- `/api/health` is new, standalone code — it has no dependency on the tRPC router layer (`src/server/api/`) and should not be added there; it's a plain Route Handler.
- Vercel's production environment is where `DATABASE_URL` (and Vercel's own auto-injected `VERCEL_ENV`) must be configured — no code change is needed to consume `VERCEL_ENV`, it's already read by `scripts/migrate-if-production.mjs`.

</code_context>

<specifics>
## Specific Ideas

- Both Vercel and Neon accounts are being created fresh for this project — no pre-existing infra to reconcile with.
- The user explicitly wants to retain full manual control over account creation and dashboard clicks (security/ownership preference), while delegating post-setup *verification* — including CLI-triggered deploy/promote/rollback actions — to Claude via an authenticated Vercel CLI token.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. (See "Not Discussed This Session" above for in-scope items left open for researcher/planner, which is distinct from scope creep.)

</deferred>

---

*Phase: 15-Deploy & Verify*
*Context gathered: 2026-07-20*
