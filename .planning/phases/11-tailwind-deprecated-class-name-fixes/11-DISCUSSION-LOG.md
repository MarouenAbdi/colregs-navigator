# Phase 11: Tailwind Deprecated Class-Name Fixes - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-19
**Phase:** 11-Tailwind Deprecated Class-Name Fixes
**Areas discussed:** rounded-sm radius conflict, outline-hidden a11y check depth, TWFX-04 verification method

---

## rounded-sm radius conflict

| Option | Description | Selected |
|--------|-------------|----------|
| Rename to rounded-sm, accept the size change | Do the literal canonical migration (rounded-[0.25rem] → rounded-sm) and accept the border-radius grows from 0.25rem to 0.375rem (1.5x). | ✓ |
| Add a new rounded-xs-equivalent theme step | Introduce a new radius token (e.g. --radius-xs = 0.25rem) for a canonical, pixel-identical class name. | |
| Leave rounded-[0.25rem] as-is, close TWFX-02 as already-satisfied | Treat Phase 10's CR-01 fix as the final resolution since bare `rounded` no longer appears. | |

**User's choice:** Rename to rounded-sm, accept the size change
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| Roll back to rounded-[0.25rem], reopen as a design call | Revert the rename on files that look wrong if the browser check shows a visible regression. | |
| Accept it regardless — canonical scale wins | Treat the 1.5x radius bump as acceptable design drift for a tech-debt/hygiene milestone; don't block on it. | ✓ |

**User's choice:** Accept it regardless — canonical scale wins
**Notes:** Reverses Phase 10's CR-01 pixel-identical-preservation stance for these two files — that fix explicitly deferred the deliberate `rounded`→`rounded-sm` class-name change to this phase.

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, remove it in this phase | Remove the eslint.config.mjs ignore pattern for rounded-[0.25rem] once the value no longer appears anywhere. | ✓ |
| Leave it, not in scope | Leave the now-unused ignore pattern alone. | |

**User's choice:** Yes, remove it in this phase
**Notes:** —

---

## outline-hidden a11y check depth

| Option | Description | Selected |
|--------|-------------|----------|
| Normal browser check only | Tab through each of the 4 components, confirm the existing focus-visible:ring-* treatment still shows a visible focus indicator. | ✓ |
| Also check forced-colors/high-contrast mode | Explicitly toggle forced-colors emulation to confirm outline-hidden's actual a11y benefit over outline-none. | |

**User's choice:** Normal browser check only
**Notes:** —

---

## TWFX-04 verification method

| Option | Description | Selected |
|--------|-------------|----------|
| Claude-in-Chrome pre-check first | Executor screenshots/inspects focus rings across the 4 areas before handoff. | |
| Skip straight to your manual check | Executor applies fixes and hands off directly to the user's real-browser walkthrough. | ✓ |

**User's choice:** Skip straight to your manual check
**Notes:** TWFX-04 already requires human confirmation; an automated pre-check would duplicate rather than add value.

---

## Claude's Discretion

None — all three areas resolved with explicit user decisions.

## Deferred Ideas

None mentioned during discussion.
