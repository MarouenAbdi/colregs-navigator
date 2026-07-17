# Phase 3: Persistence & API Layer - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-17
**Phase:** 3-Persistence & API Layer
**Areas discussed:** Database provisioning, Scenario schema shape, Gallery data approach, Not-found & error handling

---

## Database Provisioning

| Option | Description | Selected |
|--------|-------------|----------|
| Local Docker Postgres | docker-compose.yml, zero external account, reproducible for any reviewer | ✓ |
| Hosted free-tier (Neon/Supabase) | Works from any machine, but requires an account/secret to replicate | |
| SQLite for dev, Postgres for prod | Fastest local setup, but risks dev/prod parity issues | |

**User's choice:** Local Docker Postgres

| Option | Description | Selected |
|--------|-------------|----------|
| Neon free tier | Serverless Postgres, pairs with Vercel deploy, common pattern | |
| Supabase free tier | Also serverless Postgres, adds unused dashboard/auth/storage suite | |
| Not deploying live — local/demo video only | Simplest, loses "click a live link" factor | ✓ |

**User's choice:** Not deploying live — local/demo video only
**Notes:** No hosted DB provisioned for this milestone; setup docs describe local Docker only.

---

## Scenario Schema Shape

| Option | Description | Selected |
|--------|-------------|----------|
| Flat columns | One Scenario row, vesselA*/vesselB* columns, fully typed, no join complexity for a fixed 2-vessel shape | ✓ |
| JSON column per vessel | Less migration churn but loses column typing/indexing | |
| Normalized related Vessel table | Textbook normalization, adds joins for a relationship that never grows | |

**User's choice:** Flat columns

| Option | Description | Selected |
|--------|-------------|----------|
| Separate columns (posX, posY) | Fully typed, no JSON parsing | ✓ |
| Small JSON object per vessel position | More compact schema, adds JSON parsing | |

**User's choice:** Separate columns
**Notes:** Share ID generation (cuid/uuid) and "no derived-verdict column" were reaffirmed as already-locked constraints, not re-asked.

---

## Gallery Data Approach

| Option | Description | Selected |
|--------|-------------|----------|
| Build capability only, no seed data | isCurated flag + gallery.list procedure; Phase 5 owns actual curated content | ✓ |
| Seed 1-2 placeholder scenarios now | Saves a separate test fixture, risks placeholder leaking into demo | |

**User's choice:** Build capability only, no seed data

| Option | Description | Selected |
|--------|-------------|----------|
| Flag on Scenario | isCurated Boolean + displayOrder on Scenario row directly | ✓ |
| Separate GalleryEntry table | Cleaner separation, adds join complexity | |

**User's choice:** Flag on Scenario

| Option | Description | Selected |
|--------|-------------|----------|
| Add nullable rationale field now | One migration instead of two, optional field doesn't affect Phase 3 behavior | ✓ |
| Defer to Phase 5 | Keeps Phase 3 strictly scoped, costs a second migration later | |

**User's choice:** Add nullable rationale field now
**Notes:** Gallery entries are regular Scenario rows flagged isCurated, not a separate entity.

---

## Not-Found & Error Handling

| Option | Description | Selected |
|--------|-------------|----------|
| TRPCError NOT_FOUND | Idiomatic tRPC error channel, typed client-side error handling | ✓ |
| Result-style response through the router | Extends domain Result<T> to API boundary, doubles up on tRPC's own error channel | |

**User's choice:** TRPCError NOT_FOUND

| Option | Description | Selected |
|--------|-------------|----------|
| Reuse domain Zod schemas | Matches CLAUDE.md's shared-boundary-contract pattern, no duplicate types | ✓ |
| Separate tRPC input schema | More flexibility, but CLAUDE.md explicitly avoids this duplication | |

**User's choice:** Reuse domain Zod schemas
**Notes:** Result<T> stays a domain-internal convention; does not extend across the tRPC boundary.

---

## Claude's Discretion

- Placement of the "re-run classifyEncounter() on read" logic (application/use-case layer vs. repository vs. router) — ROADMAP.md names "application use cases" as a distinct layer but this wasn't discussed explicitly.
- Prisma migration workflow specifics (migrate dev vs. db push, migrations checked into repo).
- Exact router/procedure naming and file layout within `src/server/api/` beyond "scenario and gallery routers."
- Confirming Prisma's vessel-type columns reuse Phase 1's exact 5-value kebab-case union rather than redefining it.

## Deferred Ideas

- Live hosted deployment (Neon/Supabase) — explicitly declined for this milestone; revisit only if a future milestone wants a live demo link.
- Curating the actual 5–8 gallery scenarios and rationale text — belongs to Phase 5 (SCEN-03).
