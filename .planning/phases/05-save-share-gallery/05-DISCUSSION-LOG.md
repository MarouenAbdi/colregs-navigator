# Phase 5: Save, Share & Gallery - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-17
**Phase:** 5-Save, Share & Gallery
**Areas discussed:** Save/share flow, Gallery curation & seeding

---

## Save/share flow

| Option | Description | Selected |
|--------|-------------|----------|
| Header button + inline link | 'Save & Share' button next to 'Reset Scenario'; shows link inline on success | |
| Header button + redirect | Same button, but navigates to the new share URL on success | |
| You decide | Claude picks during planning | ✓ |

**User's choice:** You decide (trigger placement/success feedback)
**Notes:** Left to planning — pick the simplest approach fitting the existing SandboxContainer header.

| Option | Description | Selected |
|--------|-------------|----------|
| Fully editable (reuse sandbox as-is) | Opens SandboxContainer pre-seeded with saved vessels, fully draggable | |
| Read-only viewer | Distinct non-draggable presentation | |
| Editable, but with a visible banner | Same as fully editable, plus a "Viewing saved scenario" banner | ✓ |

**User's choice:** Editable, but with a visible banner
**Notes:** Reuses 100% of Phase 4's sandbox component; banner signals it's not the blank default state.

| Option | Description | Selected |
|--------|-------------|----------|
| /s/[shareId] + Copy button | Dedicated route with one-click Clipboard API copy + confirmation | |
| /s/[shareId], manual select | Same route, link shown as selectable text, no clipboard JS | |
| You decide | Claude picks simplest reasonable UX | ✓ |

**User's choice:** You decide (URL shape / copy interaction)
**Notes:** A `/s/[shareId]` route is the natural fit for Next.js App Router; exact copy-button styling left to planning.

| Option | Description | Selected |
|--------|-------------|----------|
| Always create new (recommended) | Every save calls scenario.create for a fresh shareId | ✓ |
| Update in place | Would require a new scenario.update mutation + ownership tracking | |

**User's choice:** Always create new
**Notes:** Matches Phase 3's schema (no update mutation exists); no auth needed to control overwrite.

---

## Gallery curation & seeding

| Option | Description | Selected |
|--------|-------------|----------|
| Prisma seed script (recommended) | One-off seed script inserts curated rows directly via Prisma Client | ✓ |
| Extend scenario.create with admin fields | Add isCurated/rationale/displayOrder to the public mutation | |
| You decide | Claude picks the simplest safe approach | |

**User's choice:** Prisma seed script (recommended)
**Notes:** Avoids adding admin-style fields to a public, unauthenticated mutation.

| Option | Description | Selected |
|--------|-------------|----------|
| One clean case per core rule (recommended) | Head-on, give-way crossing, stand-on crossing, overtaking, 1-2 Rule 18 vessel-priority cases | ✓ |
| You describe the set | User provides specific scenarios/rationale directly | |

**User's choice:** One clean case per core rule (recommended)
**Notes:** Directly showcases the domain-modeling depth the reasoning trail already computes.

| Option | Description | Selected |
|--------|-------------|----------|
| 1-2 sentences, plain language | Short textbook-caption style naming the encounter type and the key geometric fact | ✓ |
| Longer, cites the rule explicitly | 3-4 sentences citing the specific rule number in more depth | |

**User's choice:** 1-2 sentences, plain language
**Notes:** Example given: "Vessel B is nearly dead ahead of Vessel A and closing — a clear head-on situation requiring both vessels to alter course to starboard."

---

## Claude's Discretion

- Save trigger placement and success feedback (inline link vs. redirect)
- Share link URL shape and copy-to-clipboard interaction details
- Gallery browsing layout (list vs. grid, mini-chart preview vs. text-only)
- Exact wording of all 5-8 rationale texts and the specific vessel geometry for each curated scenario
- Route/file layout for the new gallery and share-link pages, and the first client-side tRPC/React Query wiring

## Deferred Ideas

None — discussion stayed within Phase 5 scope.
